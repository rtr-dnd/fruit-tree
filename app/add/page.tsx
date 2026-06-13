import { Suspense } from 'react'
import { AddFruitView } from '@/components/AddFruitView'

export default function AddPage() {
  return (
    <Suspense>
      <AddFruitView />
    </Suspense>
  )
}
