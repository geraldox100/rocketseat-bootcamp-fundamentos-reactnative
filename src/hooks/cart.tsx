import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const cart = await AsyncStorage.getItem('@GoMarket:cart');

      if(cart){
        setProducts(JSON.parse(cart));
      }
    }
    loadProducts();
  }, []);

  const addToCart = useCallback(async product => {
    product.quantity = 1;
    setProducts(prev => ([...prev, product]));    
    AsyncStorage.setItem('@GoMarket:cart',JSON.stringify(products));
  }, [products,setProducts,AsyncStorage]);

  const increment = useCallback(async id => {
    const {otherProducts,product} = separateElements(id);

    product.quantity += 1;

    updateProducts(otherProducts,product);
  }, [products,setProducts]);

  const decrement = useCallback(async id => {
    const {otherProducts,product} = separateElements(id);
    
    console.log('quantity: '+product.quantity);
    if(product.quantity >1 ){
      product.quantity -= 1;
      updateProducts(otherProducts,product);
    }else{
      console.log('remove');
      removeProduct(id);
    }
  }, [products,setProducts]);

  function separateElements(id:string):{otherProducts:Product[], product:Product}{
    const otherProducts = products.filter( p => p.id != id);
    const product = products.filter( p => p.id == id)[0];
    return {otherProducts,product};
  }

  function updateProducts(otherProducts:Product[], product:Product):void{
    setProducts([...otherProducts,product]);
    AsyncStorage.setItem('@GoMarket:cart',JSON.stringify(products));
  }

  function removeProduct(id:string):void{
    const otherProducts = products.filter( p => p.id != id);
    setProducts([...otherProducts]);
    AsyncStorage.setItem('@GoMarket:cart',JSON.stringify(products));
  }

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
