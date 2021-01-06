import React, { useState } from "react"
import ReactDOM from "react-dom"
import { BrowserRouter, Switch, Route } from "react-router-dom"
import OrderTable from "./components/OrderTable"
import Loggin from "./components/Loggin"
import Register from "./components/Register"
import GuardedRoute from "./GuardedRoute"

function Main() {
  const [loggedIn, setLoggedIn] = useState(
    Boolean(localStorage.getItem("username"))
  )
  return (
    <BrowserRouter>
      <Switch>
        <Route path="/login">
          <Loggin setLoggedIn={setLoggedIn} />
        </Route>
        <Route path="/register">
          <Register setLoggedIn={setLoggedIn} />
        </Route>
        <GuardedRoute
          auth={loggedIn}
          component={OrderTable}
          path="/"
          exact
        ></GuardedRoute>
      </Switch>
    </BrowserRouter>
  )
}

ReactDOM.render(<Main />, document.querySelector("#app"))

if (module.hot) {
  module.hot.accept()
}
