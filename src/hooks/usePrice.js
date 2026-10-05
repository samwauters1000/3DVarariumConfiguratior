import { useMemo } from 'react'
import { calculateTotalPrice, getPriceSections } from '../utils/pricing.js'
import { useConfigurator } from './useConfigurator.jsx'

export function usePrice() {
  const { configuration } = useConfigurator()
  return useMemo(
    () => ({ sections: getPriceSections(configuration), total: calculateTotalPrice(configuration) }),
    [configuration],
  )
}
