import React, { useEffect, useContext, useRef } from "react"
import Axios from "axios"
import { NavLink, withRouter, useParams } from "react-router-dom"
import StateContext from "../StateContext"
import io from "socket.io-client"
import { useImmer } from "use-immer"

function OrderMenu(props) {
  const { type } = useParams()
  const dropdownMenu = useRef(null)
  const socket = useRef(null)
  const appState = useContext(StateContext)
  const [state, setState] = useImmer({
    currentProductType: {},
    products: [],
    productTypes: [],
    basketProducts: [],
    basketPrice: 0.0,

    showDropdown: false,
    shownCategory: "",
    viewType: 0,

    isFailedToLoad: false
  })

  useEffect(() => {
    const request = Axios.CancelToken.source()
    async function sendRequest() {
      try {
        const response = await Axios.get("/api/products", {
          cancelToken: request.token
        })
        let chosenType
        if (type === "dummy") {
          chosenType = response.data.types[0]
        } else {
          chosenType = response.data.types.find(el => el.forUrl === type)
        }
        setState(draft => {
          draft.products = response.data.products
          draft.productTypes = response.data.types
          draft.currentProductType = chosenType
        })
        if (type === "dummy") {
          props.history.push(`/order/${chosenType.forUrl}`)
        }
      } catch (error) {
        console.log("Request failed or was cancelled.")
        setState(draft => {
          draft.isFailedToLoad = true
        })
      }
    }
    sendRequest()

    socket.current = io("http://localhost:5000")

    socket.current.on("createdOrderFromServer", order => {
      if (order.client_id === +appState.user.user_id) props.history.push("/")
    })

    return () => {
      request.cancel()
      socket.current.disconnect()
    }
  }, [])

  useEffect(() => {
    let totalPrice = 0.0
    if (state.basketProducts.length !== 0) {
      state.products.forEach(product => {
        let prod = state.basketProducts.find(prod => prod.id === product.id)
        if (prod) {
          totalPrice = totalPrice + product.price * prod.quantity
        }
      })
    }
    setState(draft => {
      draft.basketPrice = totalPrice
    })
  }, [state.basketProducts])

  useEffect(() => {
    if (state.showDropdown) {
      document.addEventListener("click", closeDropdown)
    }
  }, [state.showDropdown])

  async function handleSubmitOrder(e) {
    e.preventDefault()
    if (state.basketProducts.length !== 0) {
      socket.current.emit("createdOrderFromBrowser", {
        basket: state.basketProducts,
        token: appState.user.token
      })
    }
  }

  function renderDropdownMenu() {
    return state.productTypes.map(productType => (
      <NavLink
        key={productType.forUrl}
        to={"/order/" + productType.forUrl}
        className="dropdown-menu-element"
        activeClassName="link-active"
        onClick={() =>
          setState(draft => {
            draft.currentProductType = productType
          })
        }
      >
        {productType.capitalized}
      </NavLink>
    ))
  }

  function renderProducts() {
    if (state.viewType === 0) {
      return (
        <table className="order-menu-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Description</th>
              <th>Price</th>
            </tr>
          </thead>
          <tbody>
            {state.products.map(product => {
              if (product.type === state.currentProductType.forUrl)
                return (
                  <tr
                    key={product.id}
                    onClick={() =>
                      setState(draft => {
                        let index = draft.basketProducts.findIndex(
                          prod => prod.id === product.id
                        )
                        if (index !== -1) {
                          draft.basketProducts[index].quantity += 1
                        } else {
                          draft.basketProducts.push({
                            id: product.id,
                            quantity: 1
                          })
                        }
                      })
                    }
                  >
                    <td>{product.name}</td>
                    <td>{product.description}</td>
                    <td>{product.price}$</td>
                  </tr>
                )
            })}
          </tbody>
        </table>
      )
    } else {
      return (
        <ul className="product-grid">
          {state.products.map(product => {
            if (product.type === state.currentProductType.forUrl)
              return (
                <li
                  key={product.id}
                  className="product-cell"
                  onClick={() =>
                    setState(draft => {
                      let index = draft.basketProducts.findIndex(
                        prod => prod.id === product.id
                      )
                      if (index !== -1) {
                        draft.basketProducts[index].quantity += 1
                      } else {
                        draft.basketProducts.push({
                          id: product.id,
                          quantity: 1
                        })
                      }
                    })
                  }
                >
                  <img src={product.imgsrc}></img>
                  <h2>{product.name}</h2>
                  <p>{product.description}</p>
                  <span>{product.price}$</span>
                </li>
              )
          })}
        </ul>
      )
    }
  }

  function renderBasket() {
    return state.products.map(product => {
      let index = state.basketProducts.findIndex(prod => prod.id === product.id)
      if (index !== -1) {
        return (
          <tr key={product.id}>
            <td>{product.name}</td>
            <td>{product.price * state.basketProducts[index].quantity}$</td>
            <td>
              <button
                onClick={() => {
                  setState(draft => {
                    if (draft.basketProducts[index].quantity > 1) {
                      draft.basketProducts[index].quantity--
                    } else {
                      draft.basketProducts.splice(index, 1)
                    }
                  })
                }}
              >
                -
              </button>
              {state.basketProducts[index].quantity}
              <button
                onClick={() =>
                  setState(draft => {
                    draft.basketProducts[index].quantity += 1
                  })
                }
              >
                +
              </button>
            </td>
          </tr>
        )
      }
    })
  }

  function closeDropdown(e) {
    e.preventDefault()
    // To prevent dropdown from closing when clicked on it.
    // if (!dropdownMenu.current.contains(e.target)) {
    setState(draft => {
      draft.showDropdown = false
    })
    document.removeEventListener("click", closeDropdown)
    // }
  }

  return (
    <>
      <div className="order-menu-basket">
        <div className="order-menu-navbar">
          <NavLink to="/" className="navbar-element">
            <span>🢀</span>
          </NavLink>

          {state.productTypes.length !== 0 && (
            <span
              className={
                state.showDropdown
                  ? "navbar-element menu-dropdown-button-active"
                  : "navbar-element menu-dropdown-button"
              }
              onClick={() =>
                setState(draft => {
                  draft.showDropdown = true
                })
              }
            >
              {state.currentProductType.capitalized}
            </span>
          )}

          {state.showDropdown && (
            <div ref={dropdownMenu} className="dropdown-menu">
              {renderDropdownMenu()}
            </div>
          )}
          <span
            className="navbar-element"
            onClick={() =>
              setState(draft => {
                if (draft.viewType === 0) {
                  draft.viewType = 1
                } else {
                  draft.viewType = 0
                }
              })
            }
          >
            {state.viewType === 0 ? "Table" : "List"}
          </span>
        </div>
        <h4>Basket</h4>
        {state.basketProducts.length !== 0 && (
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Price</th>
                <th>Quantity</th>
              </tr>
            </thead>
            <tbody>{renderBasket()}</tbody>
          </table>
        )}
        <div className="order-menu-basket-total">
          <div>Total price: {state.basketPrice}$ </div>
          <div>
            <span className="create-order-button" onClick={handleSubmitOrder}>
              Order
            </span>
          </div>
        </div>
      </div>
      <div className="order-menu-container">
        {state.isFailedToLoad ? (
          <div className="filler-message">
            <span className="failed-to-load-message">Failed To Load.</span>
          </div>
        ) : state.products.length !== 0 ? (
          renderProducts()
        ) : (
          <div className="filler-message">
            <span className="loading-message">Loading...</span>
          </div>
        )}
      </div>
    </>
  )
}

export default withRouter(OrderMenu)
