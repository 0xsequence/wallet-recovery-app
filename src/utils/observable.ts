import { WritableObservable } from 'micro-observables'

export const syncWithLocalStore = <T>(
  key: string,
  observable: WritableObservable<T>,
  onChange?: (value: T) => void,
  options: { immediate?: boolean } = {}
) => {
  const storedValue = window.localStorage.getItem(key)

  if (storedValue !== null) {
    try {
      observable.set(JSON.parse(storedValue))

      if (options.immediate) {
        onChange?.(observable.get())
      }
    } catch (err) {
      console.error(`LocalStorageObservable: Stored data for ${key} is corrupted.`)
    }
  }

  // Sync localStorage when observable updates
  observable.subscribe(value => {
    window.localStorage.setItem(key, JSON.stringify(value))
    onChange?.(value)
  })

  return observable
}
