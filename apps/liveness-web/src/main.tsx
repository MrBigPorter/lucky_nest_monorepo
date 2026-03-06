import React from "react";
import ReactDOM from "react-dom/client";
import { Amplify } from "aws-amplify";
import App from "./App.tsx";
import "./index.css";
import "@aws-amplify/ui-react/styles.css";

//  正确的 AWS 身份池配置
Amplify.configure({
  Auth: {
    Cognito: {
      identityPoolId: "us-east-1:dd93eb3f-4485-47d8-9497-606215370143",
      allowGuestAccess: true,
    },
  },
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
