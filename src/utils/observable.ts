import { Observable } from 'micro-observables'

type SubscribeCallback<T> = T extends Observable<infer R> ? (value: R) => void : never

export function subscribeImmediately<T extends Observable<any>>(observable: T, cb: SubscribeCallback<T>) {
  cb(observable.get())
  observable.subscribe(cb)
}
