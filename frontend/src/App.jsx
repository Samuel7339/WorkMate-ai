import React from 'react'
import { Toaster } from 'sonner';
import ChatWindow from "./components/ChatWindow";
import ApprovalPage from './pages/ApprovalPage';

export const App = () => {
  const path = window.location.pathname;

  return (
    <>
      <Toaster position="top-right" richColors />
      {path === "/approval" ? <ApprovalPage /> : <ChatWindow />}
    </>
  );
}
