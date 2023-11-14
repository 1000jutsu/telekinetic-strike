import { Observable, filter } from 'rxjs';

function transform(obs : Observable<any>) {
  // return obs.map
}

function withUpdateType(type: any) {
  return (obs: Observable<any>) => obs.pipe(filter((e) => e.type === type))
}

function withId(id: any) {
  return (obs: Observable<any>) => obs.pipe(filter((e) => e.userId === id))
}

function withText() {
  return (obs: Observable<any>) => obs.pipe(filter((e) => e.message))
}

function withPhoto() {
  return (obs: Observable<any>) => obs.pipe(filter((e) => e.photo))
}

function withDocument() {
  return (obs: Observable<any>) => obs.pipe(filter((e) => e.document))
}

function withAudio() {
  return (obs: Observable<any>) => obs.pipe()
}

function withVideo() {
  return (obs: Observable<any>) => obs.pipe(filter((e) => e.video))
}

function withVoice() {
  return (obs: Observable<any>) => obs.pipe(filter((e) => e.voice))
}

