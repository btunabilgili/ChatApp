import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Login from './components/Login';
import Chat from './components/Chat';
import AuthProvider from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path='/login' element={<Login />}/>
          <Route element={<ProtectedRoute />}>
            <Route path='*' element={<Chat />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App
