import React, { useEffect, useContext } from "react"
import Axios from "axios"
import { useImmerReducer } from "use-immer"
import { withRouter } from "react-router-dom"
import DispatchContext from "../DispatchContext"

function Loggin(props) {
  const appDispatch = useContext(DispatchContext)

  const initialState = {
    username: {
      value: "",
      isInvalid: false,
      message: ""
    },
    password: {
      value: "",
      isInvalid: false,
      message: ""
    },
    errorMessage: "",
    submitCount: 0
  }

  function registrationFormReducer(draft, action) {
    switch (action.type) {
      case "usernameCheck":
        draft.errorMessage = ""
        draft.username.isInvalid = false
        draft.username.value = action.value
        if (draft.username.value.length === 0) {
          draft.username.isInvalid = true
          draft.username.message = "Provide a username."
        }
        break
      case "passwordCheck":
        draft.errorMessage = ""
        draft.password.isInvalid = false
        draft.password.value = action.value
        if (draft.password.value.length === 0) {
          draft.password.isInvalid = true
          draft.password.message = "Provide a password."
        }
        break
      case "setErrorMessage":
        draft.errorMessage = action.value
        break
      case "submitForm":
        if (!draft.username.isInvalid && !draft.password.isInvalid) {
          draft.submitCount++
        }
        break
    }
  }

  const [state, dispatch] = useImmerReducer(
    registrationFormReducer,
    initialState
  )

  useEffect(() => {
    if (state.submitCount) {
      const request = Axios.CancelToken.source()
      async function sendRequest() {
        try {
          const response = await Axios.post(
            "/api/users/login",
            {
              username: state.username.value,
              password: state.password.value
            },
            { cancelToken: request.token }
          )
          console.log(response)
          appDispatch({ type: "login", data: response.data })
          props.history.push("/")
        } catch (error) {
          if (error.response) {
            console.log(error.response.data.message)
            dispatch({
              type: "setErrorMessage",
              value: error.response.data.message
            })
          } else {
            console.log("Request failed or was cancelled.")
          }
        }
      }
      sendRequest()
      return () => request.cancel()
    }
  }, [state.submitCount])

  function handleSubmit(e) {
    e.preventDefault()
    dispatch({ type: "usernameCheck", value: state.username.value })
    dispatch({ type: "passwordCheck", value: state.password.value })
    dispatch({ type: "submitForm" })
  }

  return (
    <div className="form-wrapper">
      <h1>Log In</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="username-register">Username</label>
          <input
            onChange={e =>
              dispatch({
                type: "usernameCheck",
                value: e.target.value
              })
            }
            id="username-register"
            name="username"
            className={state.username.isInvalid ? "input-invalid" : ""}
            type="text"
            autoComplete="off"
          />
          {state.username.isInvalid && <small>{state.username.message}</small>}
        </div>
        <div>
          <label htmlFor="password-register">Password</label>
          <input
            onChange={e =>
              dispatch({
                type: "passwordCheck",
                value: e.target.value
              })
            }
            id="password-register"
            name="password"
            className={state.password.isInvalid ? "input-invalid" : ""}
            type="password"
          />
          {state.password.isInvalid && <small>{state.password.message}</small>}
        </div>
        {state.errorMessage.length !== 0 && (
          <div className="wrong-credentials-message">{state.errorMessage}</div>
        )}
        <button type="button" onClick={() => props.history.push("/register")}>
          Register
        </button>
        <button type="submit">Sign up</button>
      </form>
    </div>
  )
}

export default withRouter(Loggin)
