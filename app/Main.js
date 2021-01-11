import React, { useEffect } from "react"
import ReactDOM from "react-dom"
import { BrowserRouter, Switch, Route } from "react-router-dom"
import { useImmerReducer } from "use-immer"
import OrderTable from "./components/OrderTable"
import Loggin from "./components/Loggin"
import Register from "./components/Register"
import GuardedRoute from "./GuardedRoute"
import StateContext from "./StateContext"
import DispatchContext from "./DispatchContext"
import Axios from "axios"

Axios.defaults.baseURL = "http://localhost:5000"

function Main() {
  const initialState = {
    loggedIn: Boolean(localStorage.getItem("username")),
    user: {
      token: localStorage.getItem("token"),
      username: localStorage.getItem("username"),
      is_admin: localStorage.getItem("isAdmin")
    }
  }

  function ourReducer(draft, action) {
    switch (action.type) {
      case "login":
        draft.loggedIn = true
        draft.user = action.data
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
      localStorage.setItem("username", state.user.username)
      localStorage.setItem("isAdmin", state.user.is_admin)
    } else {
      localStorage.removeItem("token")
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
