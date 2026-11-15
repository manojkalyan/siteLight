"""Acquire bounded windows of published correlated NASA LDEM clones, never synthetic noise."""
import os
os.environ['OPENBLAS_NUM_THREADS']='1'
import hashlib,json,urllib.request,re,time,concurrent.futures,struct
from pathlib import Path
from html.parser import HTMLParser
import numpy as np
import rasterio
from rasterio.windows import Window
from scripts.science_pipeline import ROOT

OUT=ROOT/'data/raw/terrain-evidence';OUT.mkdir(parents=True,exist_ok=True)
PAGE='https://pgda.gsfc.nasa.gov/products/78'
class Links(HTMLParser):
    def __init__(self):super().__init__();self.links=[]
    def handle_starttag(self,tag,attrs):
        if tag=='a':self.links.extend(v for k,v in attrs if k=='href')
def sha(path):return hashlib.sha256(path.read_bytes()).hexdigest()
def inspect(url):
    for attempt in range(4):
        try:
            with urllib.request.urlopen(urllib.request.Request(url,headers={'Range':'bytes=0-15'}),timeout=30) as response:
                first=response.read(16);header=response.headers
                if response.status!=206 or first[:4] not in (b'II*\0',b'II+\0',b'MM\0*'):raise ValueError('Expected ranged TIFF, not an HTML/missing-product response')
                return {'etag':header.get('etag'),'lastModified':header.get('last-modified'),'contentRange':header.get('content-range'),'wholeSourceSha256':None}
        except Exception:
            if attempt==3:raise
            time.sleep(attempt+1)

def ranged_tiff_window(url,window,expected_affine):
    """Read exact row byte ranges from the source's uncompressed float32 TIFF strips.

    Avoid HTTP/GDAL strip-cache interactions while retaining a bounded subset.
    Header, strip geometry, georeferencing and every Content-Range are checked.
    """
    requests=[]
    def read(a,b):
        for attempt in range(3):
            try:
                with urllib.request.urlopen(urllib.request.Request(url,headers={'Range':f'bytes={a}-{b}'}),timeout=45) as response:
                    raw=response.read();match=re.fullmatch(r'bytes (\d+)-(\d+)/(\d+)',response.headers.get('content-range',''))
                    if response.status!=206 or not match or (int(match[1]),int(match[2]))!=(a,b) or len(raw)!=b-a+1:raise ValueError('Incomplete source byte range')
                    requests.append({'start':a,'end':b,'sha256':hashlib.sha256(raw).hexdigest()});return raw
            except Exception:
                if attempt==2:raise
                time.sleep(.5*(attempt+1))
    header=read(0,65535)
    if header[:4]!=b'II*\0':raise ValueError('This bounded clone reader requires classic little-endian TIFF')
    offset=struct.unpack_from('<I',header,4)[0];count=struct.unpack_from('<H',header,offset)[0];entries={}
    for i in range(count):
        pos=offset+2+12*i;tag,kind,n,value=struct.unpack_from('<HHII',header,pos);entries[tag]=(kind,n,pos+8,value)
    def tag(number):
        kind,n,inline,address=entries[number];codes={3:('H',2),4:('I',4),12:('d',8)}
        if kind not in codes:raise ValueError('Unexpected TIFF tag type')
        code,width=codes[kind];size=n*width;start=inline if size<=4 else address
        raw=header[start:start+size] if start+size<=len(header) else read(start,start+size-1)
        return struct.unpack('<'+code*n,raw)
    width,height=tag(256)[0],tag(257)[0]
    if tag(258)!=(32,) or tag(259)!=(1,) or tag(277)!=(1,) or tag(278)!=(1,) or tag(339)!=(3,):raise ValueError('Unexpected clone TIFF strip/sample contract')
    scales,tie=tag(33550),tag(33922);doubles=tag(34736)
    if scales[:2]!=(5.,5.) or not any(abs(v-1737400)<1e-6 for v in doubles):raise ValueError('Unexpected clone projection units/reference sphere')
    col,row,ncol,nrow=map(int,[window.col_off,window.row_off,window.width,window.height])
    if col<0 or row<0 or col+ncol>width or row+nrow>height:raise ValueError('Clone does not cover requested window')
    origin_x=tie[3]-tie[0]*5;origin_y=tie[4]+tie[1]*5
    if not np.allclose([5,0,origin_x+col*5,0,-5,origin_y-row*5],expected_affine,rtol=0,atol=1e-8):raise ValueError('Clone affine mismatch')
    offsets,counts=tag(273),tag(279)
    if len(offsets)!=height or any(counts[r]!=width*4 for r in range(row,row+nrow)):raise ValueError('Unexpected clone strip lengths')
    start=offsets[row]+col*4;end=offsets[row+nrow-1]+(col+ncol)*4-1
    if end-start>8*1024*1024:raise ValueError('Clone window exceeds bounded transfer limit')
    raw=read(start,end);a=np.empty((nrow,ncol),dtype=np.float32)
    for j in range(nrow):
        p=offsets[row+j]+col*4-start;a[j]=np.frombuffer(raw[p:p+ncol*4],dtype='<f4')
    return a,requests

def main():
    page=OUT/'pgda78.html'
    if page.exists():raw=page.read_bytes()
    else:raw=urllib.request.urlopen(PAGE,timeout=30).read();page.write_bytes(raw)
    links=Links();links.feed(raw.decode());science=json.loads((ROOT/'data/science/real-workspace.json').read_text());report={'schema':'sitelight-published-clone-windows-1','sourcePage':PAGE,'sourcePageSha256':sha(page),'scienceSha256':sha(ROOT/'data/science/real-workspace.json'),'halfWindowPixels':74,'sites':{}}
    for identifier,entry in science['sites'].items():
        site=entry['site'];tile=site['tile'];folder=OUT/tile;folder.mkdir(exist_ok=True)
        urls=sorted(set(u for u in links.links if re.search(r'/'+tile+r'/Clones/'+tile+r'_final_adj_5mpp_\d{4}_err\.tif$',u)))
        if not urls:report['sites'][identifier]={'status':'no_published_clone_links','count':0,'site':site};print(tile+': no published clone links; not replaced with invented fields.',flush=True);continue
        expected=Window(site['sourcePixel'][1]-74,site['sourcePixel'][0]-74,149,149)
        with rasterio.open(ROOT/'data/raw/terrain'/f'{tile}_surf.tif') as src:nominal=src.read(1,window=expected);affine=list(src.window_transform(expected))[:6];crs=src.crs.to_wkt()
        def acquire(url):
            number=re.search(r'_(\d{4})_err\.tif$',url)[1];path=folder/(number+'.npz');meta_path=folder/(number+'.json')
            if path.exists() and meta_path.exists():
                meta=json.loads(meta_path.read_text())
                if meta['subsetSha256']!=sha(path) or meta['url']!=url or meta['window']!=[int(expected.col_off),int(expected.row_off),149,149] or meta['shape']!=[149,149] or not np.allclose(meta['affine'],affine,rtol=0,atol=1e-8):raise ValueError('Pinned clone window changed or belongs to different coordinates')
                return meta
            identity=inspect(url)
            a,ranges=ranged_tiff_window(url,expected,affine)
            if a.shape!=(149,149) or not np.isfinite(a).all():raise ValueError('Incomplete clone window')
            if abs(float(a[74,74])-site['surfaceElevationM'])>100:raise ValueError('Clone interpretation/height mismatch')
            np.savez_compressed(path,elevationM=a)
            meta={'url':url,'clone':int(number),'subsetFile':str(path.relative_to(ROOT)).replace('\\','/'),'subsetSha256':sha(path),'ranges':ranges,'window':[int(expected.col_off),int(expected.row_off),149,149],'affine':affine,'shape':[149,149],**identity,'meaning':'Published correlated absolute-height realization; retained spatial window only. Full remote file SHA is not claimed.'}
            meta_path.write_text(json.dumps(meta,indent=2)+'\n');return meta
        records=[]
        with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
            for i,result in enumerate(pool.map(acquire,urls)):
                records.append(result)
                if (i+1)%10==0:print(tile+': '+str(i+1)+'/'+str(len(urls))+' clone windows retained.',flush=True)
        report['sites'][identifier]={'status':'acquired','count':len(records),'site':site,'grid':{'size':149,'spacingM':5,'originX':-370,'originY':370,'projectionScale':entry['terrain']['grid']['projectionScale']},'sources':records,'sourceCrsWkt':crs}
        (OUT/'clone-windows.json').write_text(json.dumps(report,indent=2)+'\n')
    report['limits']=['Source ensemble supports correlated local-footprint propagation; it does not include far-field/orientation covariance or independent ground truth','Empirical ensemble percentiles must not be presented as guaranteed mission confidence bounds','Cached data retains declared windows and hashes; whole remote source hashes are not claimed']
    (OUT/'clone-windows.json').write_text(json.dumps(report,indent=2)+'\n');print('Completed published clone-window acquisition.',flush=True)

if __name__=='__main__':main()
