import React, { useEffect, useContext, useRef } from "react"
import { withRouter } from "react-router-dom"
import { useImmer } from "use-immer"
import Axios from "axios"
import moment from "moment"
import io from "socket.io-client"
import StateContext from "../StateContext"

function OrderTable(props) {
  const status = Object.freeze({
    ACCEPTED: 0,
    COOCKING: 1,
    PACKAGING: 2,
    READY: 3
  })

  const appState = useContext(StateContext)
  const orderLog = useRef(null)
  const socket = useRef(null)
  const [state, setState] = useImmer({ orders: [] })

  useEffect(() => {
    const request = Axios.CancelToken.source()
    async function sendRequest() {
      try {
        const response = await Axios.get("/api/orders", {
          cancelToken: request.token
        })
        setState(draft => {
          draft.orders = response.data
        })
      } catch (error) {
        console.log("Request failed or was cancelled.")
      }
    }
    sendRequest()

    socket.current = io("http://localhost:5000")

    socket.current.on("createdOrderFromServer", order => {
      console.log(order)
      setState(draft => {
        draft.orders.push(order)
      })
    })

    socket.current.on("updatedOrderFromServer", order => {
      console.log(order)
      setState(draft => {
        draft.orders[draft.orders.findIndex(ord => ord.id === order.id)] = order
      })
    })

    socket.current.on("deletedOrdersFromServer", orders => {
      console.log(orders)
      setState(draft => {
        draft.orders = draft.orders.filter(order => !orders.includes(order.id))
      })
    })

    return () => {
      request.cancel()
      socket.current.disconnect()
    }
  }, [])

  useEffect(() => {
    orderLog.current.scrollTop = orderLog.current.scrollHeight
  }, [state.orders])

  function changeStatus(order, newStatus) {
    socket.current.emit("updatedOrderFromBrowser", {
      order: { ...order, status: newStatus },
      token: appState.user.token
    })
    setState(draft => {
      draft.orders[draft.orders.findIndex(ord => ord.id === order.id)] = {
        ...order,
        status: newStatus
      }
    })
  }

  function renderOrderStatus(userIsAdmin, order) {
    if (userIsAdmin) {
      return (
        <select
          value={order.status}
          onChange={e => changeStatus(order, e.target.value)}
        >
          <option value={status.ACCEPTED}>Accepted</option>
          <option value={status.COOCKING}>Coocking</option>
          <option value={status.PACKAGING}>Packaging</option>
          <option value={status.READY}>Ready</option>
        </select>
      )
    }
    switch (order.status) {
      case status.ACCEPTED:
        return "Accepted"
      case status.COOCKING:
        return "Coocking"
      case status.PACKAGING:
        return "Packaging"
      case status.READY:
        return "Ready"
    }
  }

  function renderTable() {
    let userIsAdmin = appState.user.is_admin
    return state.orders.map(order => {
      return (
        <tr key={order.id}>
          <td>{order.username}</td>
          <td>{moment(order.created_at).format("hh:mm:ss a")}</td>
          <td>{renderOrderStatus(userIsAdmin, order)}</td>
        </tr>
      )
    })
  }

  return (
    <>
      <h1 className="table-header">Orders Table</h1>
      <div id="orderLog" ref={orderLog} className="order-table-wrapper">
        <table className="order-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Time Ordered</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>{renderTable()}</tbody>
        </table>
      </div>
      <button
        className="new-order-button"
        onClick={() => props.history.push("/order/drinks")}
      >
        New Order
      </button>
    </>
  )
}

export default withRouter(OrderTable)
