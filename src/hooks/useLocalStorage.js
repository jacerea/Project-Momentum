import { useState, useEffect } from 'react'

export function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    // localStorage throws in private/incognito on some browsers, so we can't assume it works
    try {
      const stored = localStorage.getItem(key)
      return stored ? JSON.parse(stored) : initialValue
    } catch {
      return initialValue
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch {
      // storage quota exceeded or access denied — nothing we can do, just skip the write
    }
  }, [key, value])

  return [value, setValue]
}
