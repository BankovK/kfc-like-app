import React, { useEffect, useRef } from "react"
import moment from "moment"

//hardcoded orders
const orders = []
for (let index = 0; index < 80; index++) {
  orders.push({
    id: index,
    name: "Client " + index,
    created: Date.now() - Math.floor(Math.random() * 10000),
    status: Math.floor(Math.random() * 4)
  })
}

function OrderTable() {
  const orderLog = useRef(null)
  const status = Object.freeze({
    ACCEPTED: 0,
    COOCKING: 1,
    PACKAGING: 2,
    READY: 3
  })

  useEffect(() => {
    orderLog.current.scrollTop = orderLog.current.scrollHeight
  }, [])

  function renderOrderStatus(value) {
    switch (value) {
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
    orders.sort((order1, order2) => order1.created - order2.created)
    return orders.map(order => {
      return (
        <tr key={order.id}>
          <td>{order.name}</td>
          <td>{moment(order.created).format("hh:mm:ss")}</td>
          <td>{renderOrderStatus(order.status)}</td>
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
      <button className="new-order-button">New Order</button>
    </>
  )
}

export default OrderTable
