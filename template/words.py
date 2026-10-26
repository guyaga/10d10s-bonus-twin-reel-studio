import sys, json; sys.stdout.reconfigure(encoding='utf-8')
from faster_whisper import WhisperModel
R = json.load(open('{{PROJECT}}/reel.json', encoding='utf-8'))
m = WhisperModel('medium', compute_type='int8')
segs, _ = m.transcribe('{{PROJECT}}/audio/narration.wav', language=R['language'], word_timestamps=True)
W = [[w.word.strip(), round(w.start + 0.2, 2), round(w.end + 0.2, 2)] for s in segs for w in s.words]
json.dump(W, open('{{PROJECT}}/audio/words.json', 'w', encoding='utf-8'), ensure_ascii=False)
print(' '.join(w[0] for w in W))
