import React, { useEffect, useContext } from "react"
import Axios from "axios"
import { useImmerReducer } from "use-immer"
import { withRouter } from "react-router-dom"
import DispatchContext from "../DispatchContext"

function Register(props) {
  const appDispatch = useContext(DispatchContext)

  const initialState = {
    username: {
      value: "",
      isInvalid: false,
      message: "",
      isUnique: false,
      isChecked: false,
      checkInProgress: false,
      checkCount: 0
    },
    email: {
      value: "",
      isInvalid: false,
      message: "",
      isUnique: false,
      isChecked: false,
      checkInProgress: false,
      checkCount: 0
    },
    password: {
      value: "",
      isInvalid: false,
      message: ""
    },
    formMessage: {
      isError: false,
      message: ""
    },
    submitCount: 0
  }

  function registrationFormReducer(draft, action) {
    switch (action.type) {
      case "usernameImmediately":
        draft.formMessage.isError = false
        draft.formMessage.message = ""

        draft.username.isInvalid = false
        draft.username.value = action.value
        if (draft.username.value.length > 30) {
          draft.username.isInvalid = true
          draft.username.message = "Username cannot exceed 30 characters."
        }
        if (
          draft.username.value &&
          !/^([a-zA-z0-9]+)$/.test(draft.username.value)
        ) {
          draft.username.isInvalid = true
          draft.username.message =
            "Username can only contain numbers and letters."
        }
        break
      case "usernameAfterDelay":
        if (draft.username.value.length < 3) {
          draft.username.isInvalid = true
          draft.username.message =
            "Username must contain at least 3 characters."
        }
        if (!draft.username.isInvalid) {
          if (!action.noRequest) {
            draft.username.isChecked = false
            draft.username.checkInProgress = true
            draft.username.checkCount++
          } else if (!draft.username.checkInProgress) {
            if (!draft.username.isChecked) {
              draft.username.isInvalid = true
            } else if (!draft.username.isUnique) {
              draft.username.isInvalid = true
            }
          } else {
            draft.username.isInvalid = true
            draft.username.message = "Wait to check if username is unique."
          }
        }
        break
      case "usernameUniqueCheckFailed":
        draft.username.checkInProgress = false
        draft.username.isInvalid = true
        draft.username.message = "Failed to check if username is unique."
        break
      case "usernameUniqueResults":
        if (action.value) {
          draft.username.isInvalid = true
          draft.username.isUnique = false
          draft.username.message = "That username is already being used."
        } else {
          draft.username.isUnique = true
        }
        draft.username.checkInProgress = false
        draft.username.isChecked = true
        break
      case "emailImmediately":
        draft.formMessage.isError = false
        draft.formMessage.message = ""

        draft.email.isInvalid = false
        draft.email.value = action.value
        break
      case "emailAfterDelay":
        if (!/^\S+@\S+.\S+$/.test(draft.email.value)) {
          draft.email.isInvalid = true
          draft.email.message = "You must provide a valid email address."
        }
        if (!draft.email.isInvalid) {
          if (!action.noRequest) {
            draft.email.isChecked = false
            draft.email.checkInProgress = true
            draft.email.checkCount++
          } else if (!draft.email.checkInProgress) {
            if (!draft.email.isChecked) {
              draft.email.isInvalid = true
            } else if (!draft.email.isUnique) {
              draft.email.isInvalid = true
            }
          } else {
            draft.email.isInvalid = true
            draft.email.message = "Wait to check if email is unique."
          }
        }
        break
      case "emailUniqueCheckFailed":
        draft.email.checkInProgress = false
        draft.email.isInvalid = true
        draft.email.message = "Failed to check if email is unique."
        break
      case "emailUniqueResults":
        if (action.value) {
          draft.email.isInvalid = true
          draft.email.isUnique = false
          draft.email.message = "That email is already being used."
        } else {
          draft.email.isUnique = true
        }
        draft.email.checkInProgress = false
        draft.email.isChecked = true
        break
      case "passwordImmediately":
        draft.formMessage.isError = false
        draft.formMessage.message = ""

        draft.password.isInvalid = false
        draft.password.value = action.value
        if (draft.password.value.length > 50) {
          draft.password.isInvalid = true
          draft.password.message = "Password cannot exceed 50 characters."
        }
        break
      case "passwordAfterDelay":
        if (draft.password.value.length < 12) {
          draft.password.isInvalid = true
          draft.password.message =
            "Password must contain at least 12 characters."
        }
        break
      case "setMessage":
        draft.formMessage.isError = action.isError
        draft.formMessage.message = action.value
        break
      case "submitForm":
        if (
          !draft.username.isInvalid &&
          !draft.email.isInvalid &&
          !draft.password.isInvalid
        ) {
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
    if (state.username.value) {
      const delay = setTimeout(
        () => dispatch({ type: "usernameAfterDelay" }),
        800
      )
      return () => clearTimeout(delay)
    }
  }, [state.username.value])

  useEffect(() => {
    if (state.username.checkCount) {
      const request = Axios.CancelToken.source()
      async function sendRequest() {
        try {
          const response = await Axios.post(
            "/api/users/doesUsernameExist",
            { username: state.username.value },
            { cancelToken: request.token }
          )
          dispatch({ type: "usernameUniqueResults", value: response.data })
        } catch (error) {
          dispatch({
            type: "usernameUniqueCheckFailed"
          })
        }
      }
      sendRequest()
      return () => request.cancel()
    }
  }, [state.username.checkCount])

  useEffect(() => {
    if (state.email.value) {
      const delay = setTimeout(() => dispatch({ type: "emailAfterDelay" }), 800)
      return () => clearTimeout(delay)
    }
  }, [state.email.value])

  useEffect(() => {
    if (state.email.checkCount) {
      const request = Axios.CancelToken.source()
      async function sendRequest() {
        try {
          const response = await Axios.post(
            "/api/users/doesEmailExist",
            { email: state.email.value },
            { cancelToken: request.token }
          )
          dispatch({ type: "emailUniqueResults", value: response.data })
        } catch (error) {
          dispatch({
            type: "emailUniqueCheckFailed"
          })
        }
      }
      sendRequest()
      return () => request.cancel()
    }
  }, [state.email.checkCount])

  useEffect(() => {
    if (state.password.value) {
      const delay = setTimeout(
        () => dispatch({ type: "passwordAfterDelay" }),
        800
      )
      return () => clearTimeout(delay)
    }
  }, [state.password.value])

  useEffect(() => {
    if (state.submitCount) {
      dispatch({
        type: "setMessage",
        isError: false,
        value: "Sending request..."
      })
      const request = Axios.CancelToken.source()
      async function sendRequest() {
        try {
          const response = await Axios.post(
            "/api/users/register",
            {
              username: state.username.value,
              email: state.email.value,
              password: state.password.value
            },
            { cancelToken: request.token }
          )
          appDispatch({ type: "login", data: response.data })
          props.history.push("/")
        } catch (error) {
          dispatch({
            type: "setMessage",
            isError: true,
            value: "Request Failed."
          })
        }
      }
      sendRequest()
      return () => request.cancel()
    }
  }, [state.submitCount])

  function handleSubmit(e) {
    e.preventDefault()

    let usernameIsChecked = true
    let emailIsChecked = true
    if (state.formMessage.isError) {
      usernameIsChecked = false
      emailIsChecked = false
    }
    dispatch({ type: "usernameImmediately", value: state.username.value })
    dispatch({
      type: "usernameAfterDelay",
      value: state.username.value,
      noRequest: true
    })
    dispatch({ type: "emailImmediately", value: state.email.value })
    dispatch({
      type: "emailAfterDelay",
      value: state.email.value,
      noRequest: true
    })
    dispatch({ type: "passwordImmediately", value: state.password.value })
    dispatch({ type: "passwordAfterDelay", value: state.password.value })

    dispatch({ type: "submitForm" })
  }

  return (
    <div className="form-wrapper">
      <h1>Registration</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="username-register">Username</label>
          <input
            onChange={e =>
              dispatch({
                type: "usernameImmediately",
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
          <label htmlFor="email-register">Email</label>
          <input
            onChange={e =>
              dispatch({
                type: "emailImmediately",
                value: e.target.value
              })
            }
            id="email-register"
            name="email"
            className={state.email.isInvalid ? "input-invalid" : ""}
            type="text"
            autoComplete="off"
          />
          {state.email.isInvalid && <small>{state.email.message}</small>}
        </div>
        <div>
          <label htmlFor="password-register">Password</label>
          <input
            onChange={e =>
              dispatch({
                type: "passwordImmediately",
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
        {state.formMessage.message.length !== 0 && (
          <div
            className={
              state.formMessage.isError
                ? `request-message-failed`
                : `request-message-loading`
            }
          >
            {state.formMessage.message}
          </div>
        )}
        <button type="submit">Register</button>
      </form>
    </div>
  )
}

export default withRouter(Register)
