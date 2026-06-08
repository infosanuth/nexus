import { createContext, useState } from "react";

export const ReceptionContext = createContext()

const ReceptionContextProvider = (props) => {

    const backendUrl = import.meta.env.VITE_BACKEND_URL
    const [rToken, setRToken] = useState(localStorage.getItem('rToken') ? localStorage.getItem('rToken') : '')

    const value = {
        backendUrl,
        rToken, setRToken,
    }

    return (
        <ReceptionContext.Provider value={value}>
            {props.children}
        </ReceptionContext.Provider>
    )

}

export default ReceptionContextProvider