import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface CartItem {
  variantId: string
  productId: string
  productTitle: string
  productSlug: string
  imageUrl: string
  size: string | null
  color: string
  price: number
  quantity: number
}

interface CartState {
  items: CartItem[]
  addItem: (item: Omit<CartItem, 'quantity'>, qtyToAdd?: number) => void
  syncWishlistItem: (item: Omit<CartItem, 'quantity'>) => void
  removeItem: (variantId: string) => void
  removeByProductId: (productId: string) => void
  removePurchasedItems: (purchasedVariantIds: (string | number)[], purchasedProductIds?: (string | number)[]) => void
  updateQuantity: (variantId: string, quantity: number) => void
  clearCart: () => void
  getTotalItems: () => number
  getTotalPrice: () => number
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      
      addItem: (item, qtyToAdd = 1) => {
        set((state) => {
          const existingItem = state.items.find((i) => i.variantId === item.variantId)
          
          if (existingItem) {
            return {
              items: state.items.map((i) =>
                i.variantId === item.variantId
                  ? { ...i, quantity: i.quantity + qtyToAdd }
                  : i
              ),
            }
          }
          
          return {
            items: [...state.items, { ...item, quantity: qtyToAdd }],
          }
        })
      },

      syncWishlistItem: (item) => {
        set((state) => {
          const existingItem = state.items.find(
            (i) => String(i.productId) === String(item.productId) || i.variantId === item.variantId
          )
          
          if (existingItem) {
            return { items: state.items }
          }
          
          return {
            items: [...state.items, { ...item, quantity: 1 }],
          }
        })
      },
      
      removeItem: (variantId) => {
        set((state) => ({
          items: state.items.filter((i) => i.variantId !== variantId),
        }))
      },

      removeByProductId: (productId) => {
        set((state) => ({
          items: state.items.filter((i) => String(i.productId) !== String(productId)),
        }))
      },

      removePurchasedItems: (purchasedVariantIds, purchasedProductIds = []) => {
        set((state) => {
          const varSet = new Set(purchasedVariantIds.map((v) => String(v).replace(/\D/g, '')).filter(Boolean))
          const prodSet = new Set(purchasedProductIds.map((p) => String(p).replace(/\D/g, '')).filter(Boolean))
          const rawVarSet = new Set(purchasedVariantIds.map((v) => String(v)).filter(Boolean))

          return {
            items: state.items.filter((item) => {
              const itemVarId = String(item.variantId)
              const itemVarNum = itemVarId.replace(/\D/g, '')
              const itemProdNum = String(item.productId || '').replace(/\D/g, '')

              const isPurchased =
                rawVarSet.has(itemVarId) ||
                (itemVarNum !== '' && varSet.has(itemVarNum)) ||
                (itemProdNum !== '' && prodSet.has(itemProdNum))

              return !isPurchased
            }),
          }
        })
      },
      
      updateQuantity: (variantId, quantity) => {
        set((state) => {
          const newQty = Math.max(0, quantity)
          return {
            items: state.items.map((i) =>
              i.variantId === variantId ? { ...i, quantity: newQty } : i
            ),
          }
        })
      },
      
      clearCart: () => {
        set({ items: [] })
      },
      
      getTotalItems: () => {
        return get().items
          .filter((i) => i && i.productTitle && i.productId && Number(i.price) > 0)
          .reduce((total, item) => total + item.quantity, 0)
      },
      
      getTotalPrice: () => {
        return get().items
          .filter((i) => i && i.productTitle && i.productId && Number(i.price) > 0)
          .reduce((total, item) => total + item.price * item.quantity, 0)
      },
    }),
    {
      name: 'toko-pakaian-cart',
      onRehydrateStorage: () => (state) => {
        if (state?.items) {
          const valid = state.items.filter((i) => i && i.productTitle && i.productId && Number(i.price) > 0)
          if (valid.length !== state.items.length) {
            state.items = valid
          }
        }
      },
    }
  )
)

