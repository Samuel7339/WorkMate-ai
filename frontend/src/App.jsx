import React from 'react'
import ChatWindow from "./components/ChatWindow";
import ApprovalPage from './pages/ApprovalPage';

export const App = () => {
  const path = window.location.pathname;

  if (path === "/approval") {
    return <ApprovalPage />;
  }

  return <ChatWindow />;
}
