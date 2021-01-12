import React, { useEffect, useState, useContext } from "react"
import Axios from "axios"
import { NavLink, withRouter } from "react-router-dom"
import StateContext from "../StateContext"

function OrderMenu(props) {
  const type = Object.freeze({
    DRINKS: 0,
    MAIN: 1,
    DESERTS: 2
  })
  const appState = useContext(StateContext)
  const [productType, setProductType] = useState(type.DRINKS)
  const [products, setProducts] = useState([])
  const [basketProducts, setBasketProducts] = useState([])

  useEffect(() => {
    if (window.location.href.search("maindishes") !== -1) {
      setProductType(type.MAIN)
    } else if (window.location.href.search("deserts") !== -1) {
      setProductType(type.DESERTS)
    } else {
      setProductType(type.DRINKS)
    }

    const request = Axios.CancelToken.source()
    async function sendRequest() {
      try {
        const response = await Axios.get("/api/products", {
          cancelToken: request.token
        })
        setProducts(response.data)
      } catch (error) {
        console.log("Request failed or was cancelled.")
      }
    }
    sendRequest()
    return () => request.cancel()
  }, [])

  function handleSubmitOrder(e) {
    e.preventDefault()
    const request = Axios.CancelToken.source()
    async function sendRequest() {
      try {
        await Axios.post(
          "/api/orders",
          {
            token: appState.user.token,
            basket: basketProducts
          },
          { cancelToken: request.token }
        )
        props.history.push("/")
      } catch (error) {
        console.log("Request failed or was cancelled.")
      }
    }
    sendRequest()
    return () => request.cancel()
  }

  function renderProducts() {
    return products.map(product => {
      if (product.type === productType)
        return (
          <tr
            key={product.id}
            onClick={() =>
              setBasketProducts(basketProducts => {
                let index = basketProducts.findIndex(
                  prod => prod.id === product.id
                )
                if (index !== -1) {
                  basketProducts[index].quantity += 1
                  return [...basketProducts]
                } else {
                  return [...basketProducts, { id: product.id, quantity: 1 }]
                }
              })
            }
          >
            <td>{product.name}</td>
            <td>{product.desription}</td>
            <td>{product.price}</td>
          </tr>
        )
    })
  }

  function renderBasket() {
    return products.map(product => {
      let index = basketProducts.findIndex(prod => prod.id === product.id)
      if (index !== -1) {
        return (
          <tr key={product.id}>
            <td>{product.name}</td>
            <td>{product.desription}</td>
            <td>{product.price * basketProducts[index].quantity}</td>
            <td>
              {basketProducts[index].quantity}
              <button
                onClick={() =>
                  setBasketProducts(prods => {
                    prods[index].quantity += 1
                    return [...prods]
                  })
                }
              >
                +
              </button>
              <button
                onClick={() => {
                  if (basketProducts[index].quantity > 1) {
                    setBasketProducts(prods => {
                      prods[index].quantity -= 1
                      return [...prods]
                    })
                  } else {
                    setBasketProducts(prods => {
                      return prods.filter(
                        prod => prod.id !== basketProducts[index].id
                      )
                    })
                  }
                }}
              >
                -
              </button>
            </td>
          </tr>
        )
      }
    })
  }

  return (
    <>
      <div className="order-menu-container">
        <div className="order-menu-navbar">
          <NavLink
            to="/order/drinks"
            className="navbar-element"
            activeClassName="link-active"
            onClick={() => setProductType(0)}
          >
            Drinks
          </NavLink>
          <NavLink
            to="/order/maindishes"
            className="navbar-element"
            activeClassName="link-active"
            onClick={() => setProductType(1)}
          >
            Main Dishes
          </NavLink>
          <NavLink
            to="/order/deserts"
            className="navbar-element"
            activeClassName="link-active"
            onClick={() => setProductType(2)}
          >
            Desert
          </NavLink>
        </div>
        {products ? (
          <table className="order-menu-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Desription</th>
                <th>Price</th>
              </tr>
            </thead>
            <tbody>{renderProducts()}</tbody>
          </table>
        ) : (
          <div>Loading...</div>
        )}
      </div>
      <div className="order-menu-basket">
        <h4>Basket</h4>
        {basketProducts.length !== 0 && (
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Desription</th>
                <th>Price</th>
                <th>Quantity</th>
              </tr>
            </thead>
            <tbody>{renderBasket()}</tbody>
          </table>
        )}
        <button onClick={handleSubmitOrder}>Order</button>
      </div>
    </>
  )
}

export default withRouter(OrderMenu)
