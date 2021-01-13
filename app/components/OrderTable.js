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

    socket.current.on("orderFromServer", order => {
      console.log(order)
      console.log(state.orders)
      setState(draft => {
        draft.orders.push(order)
      })
    })

    socket.current.on("updateOrderFromServer", order => {
      console.log("here", order)
      console.log(state.orders)
      setState(draft => {
        draft.orders[draft.orders.findIndex(ord => ord.id === order.id)] = order
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

  async function changeStatus(order, newStatus) {
    try {
      const response = await Axios.post(`/api/orders/${order.id}/edit`, {
        order: { ...order, status: newStatus },
        token: appState.user.token
      })
      socket.current.emit("updateOrderFromBrowser", {
        order: response.data.order,
        token: appState.user.token
      })
      setState(draft => {
        draft.orders[
          draft.orders.findIndex(ord => ord.id === response.data.order.id)
        ] = response.data.order
      })
    } catch (error) {
      console.log("Request failed or was cancelled.")
    }
  }

  // function renderOrderStatus(value) {
  //   switch (value) {
  //     case status.ACCEPTED:
  //       return "Accepted"
  //     case status.COOCKING:
  //       return "Coocking"
  //     case status.PACKAGING:
  //       return "Packaging"
  //     case status.READY:
  //       return "Ready"
  //   }
  // }

  function renderTable() {
    console.log(state.orders)
    return state.orders.map(order => {
      return (
        <tr key={order.id}>
          <td>{order.username}</td>
          <td>{moment(order.created_at).format("hh:mm:ss a")}</td>
          <td>
            {/* {renderOrderStatus(order.status)} */}
            <select
              value={order.status}
              onChange={e => changeStatus(order, e.target.value)}
            >
              <option value={status.ACCEPTED}>Accepted</option>
              <option value={status.COOCKING}>Coocking</option>
              <option value={status.PACKAGING}>Packaging</option>
              <option value={status.READY}>Ready</option>
            </select>
          </td>
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
