import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart')

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const productStock = await api.get(`stock/${productId}`)

      if (productStock.data.amount <= 1) {
        toast.error('Quantidade solicitada fora de estoque')
        return
      }
      const isOnCart = cart.findIndex(product => product.id === productId)
      if (isOnCart === -1) {

        const { data: product } = await api.get(`products/${productId}`)
        const newCartItem = [...cart,{...product, amount: 1}]
        setCart(newCartItem)
        toast.success('Produto adicionado ao carrinho')
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCartItem))

      } else {
        const productOnCart = cart.filter(item => item.id === productId)
        if (productOnCart[0].amount === productStock.data.amount) {
          toast.error('Quantidade solicitada fora de estoque')
          return
        }
        const updateCart = cart.map(product => {
          if (product.id === productId) {
            return { ...product, amount: product.amount + 1 }
          }
          return product
        })
        setCart(updateCart)
        toast.success('Quantidade do produto atualizada no carrinho')
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(updateCart))
      }
    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      let isOnCart = cart.findIndex((product) => product.id === productId)
      if (isOnCart === -1) throw new Error('Erro na remoção do produto')
      
      const filteredCart = cart.filter(product => product.id !== productId)
      
      setCart(filteredCart)

      localStorage.setItem('@RocketShoes:cart', JSON.stringify(filteredCart))
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      const productStock = await (await api.get(`stock/${productId}`)).data
     
      if (amount < 1) return
      
      if (amount > productStock.amount) {
        toast.error('Quantidade solicitada fora de estoque')
        return 
      }
        
      const newCart = cart.map((product) => {
        if (product.id === productId) {
          return {
            ...product,
            amount
          }
        }
          return product
      })
        setCart(newCart)
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart))
    } catch {
      toast.error('Erro na alteração de quantidade do produto')
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
