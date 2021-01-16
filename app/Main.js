import React, { useEffect } from "react"
import ReactDOM from "react-dom"
import { BrowserRouter, Switch, Route, Redirect } from "react-router-dom"
import { useImmerReducer } from "use-immer"
import OrderTable from "./components/OrderTable"
import Loggin from "./components/Loggin"
import Register from "./components/Register"
import GuardedRoute from "./GuardedRoute"
import StateContext from "./StateContext"
import DispatchContext from "./DispatchContext"
import Axios from "axios"
import OrderMenu from "./components/OrderMenu"

Axios.defaults.baseURL = "http://localhost:5000"

function Main() {
  const initialState = {
    loggedIn: Boolean(localStorage.getItem("username")),
    user: {
      token: localStorage.getItem("token"),
      username: localStorage.getItem("username"),
      user_id: localStorage.getItem("userId"),
      is_admin: localStorage.getItem("isAdmin") == "1" ? true : false
    }
  }

  function ourReducer(draft, action) {
    switch (action.type) {
      case "login":
        draft.loggedIn = true
        draft.user = {
          ...action.data,
          is_admin: action.data.is_admin == "1" ? true : false
        }
        break
      case "logout":
        draft.loggedIn = false
        break
    }
  }

  const [state, dispatch] = useImmerReducer(ourReducer, initialState)

  useEffect(() => {
    if (state.loggedIn) {
      localStorage.setItem("token", state.user.token)
      localStorage.setItem("userId", state.user.user_id)
      localStorage.setItem("username", state.user.username)
      localStorage.setItem("isAdmin", state.user.is_admin ? 1 : 0)
    } else {
      localStorage.removeItem("token")
      localStorage.removeItem("userId")
      localStorage.removeItem("username")
      localStorage.removeItem("isAdmin")
    }
  }, [state.loggedIn])

  return (
    <StateContext.Provider value={state}>
      <DispatchContext.Provider value={dispatch}>
        <BrowserRouter>
          <Switch>
            <Route path="/login">
              <Loggin />
            </Route>
            <Route path="/register">
              <Register />
            </Route>
            <GuardedRoute
              auth={state.loggedIn}
              component={OrderTable}
              path="/"
              exact
            ></GuardedRoute>
            <Route path="/order" exact>
              <Redirect to="/order/dummy" />
            </Route>
            <GuardedRoute
              auth={state.loggedIn}
              component={OrderMenu}
              path="/order/:type"
            ></GuardedRoute>
          </Switch>
        </BrowserRouter>
      </DispatchContext.Provider>
    </StateContext.Provider>
  )
}

ReactDOM.render(<Main />, document.querySelector("#app"))

if (module.hot) {
  module.hot.accept()
}
