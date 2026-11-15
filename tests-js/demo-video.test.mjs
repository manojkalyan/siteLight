import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import guide from '../data/demo/walkthrough.json' with {type:'json'};
const read=name=>readFileSync(new URL('../'+name,import.meta.url));
test('published walkthrough matches its provenance and retains a complete 2–3 minute chapter sequence',()=>{
 const video=read('public/demo/sitelight-walkthrough.mp4'),provenance=JSON.parse(read('public/demo/provenance.json'));
 assert.deepEqual(provenance,guide);assert.equal(video.length,guide.video.bytes);assert.equal(createHash('sha256').update(video).digest('hex'),guide.video.sha256);
 assert.ok(guide.duration>=120&&guide.duration<=180);assert.equal(guide.chapters.length,13);assert.ok(guide.chapters[0].start>=0&&guide.chapters[0].start<.1);
 for(let i=0;i<guide.chapters.length;i++){const c=guide.chapters[i];assert.ok(c.title&&c.description&&c.use);assert.ok(c.end>c.start);assert.ok(c.end<=guide.duration);if(i)assert.ok(c.start>=guide.chapters[i-1].end);}
 assert.equal(guide.chapters.at(-1).end,guide.duration);
});
test('MP4 supports web startup and every chapter has captions and transcript coverage',()=>{
 const bytes=read('public/demo/sitelight-walkthrough.mp4'),boxes=[];
 for(let at=0;at<bytes.length;){const size=bytes.readUInt32BE(at);assert.ok(size>=8&&at+size<=bytes.length);boxes.push(bytes.toString('ascii',at+4,at+8));at+=size;}
 assert.equal(boxes[0],'ftyp');assert.ok(boxes.indexOf('moov')>=0&&boxes.indexOf('moov')<boxes.indexOf('mdat'));
 const captions=read('public/demo/sitelight-walkthrough.vtt').toString(),transcript=read('public/demo/sitelight-walkthrough.txt').toString();assert.ok(captions.startsWith('WEBVTT\n'));assert.equal((captions.match(/ --> /g)||[]).length,13);
 for(const c of guide.chapters){assert.ok(captions.includes(c.title));assert.ok(transcript.includes(c.title));}
 assert.ok(read('public/demo/sitelight-walkthrough-poster.jpg').length>1000);
});
