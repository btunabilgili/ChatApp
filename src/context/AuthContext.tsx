import { createContext, useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { RefreshTokenResponse } from '@/models/ChatHubModels';

export interface User {
  AccessToken: string;
  RefreshToken: string;
  ExpiresAt: string;
}

export interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => void;
  logout: () => void;
  useRefreshToken: () => Promise<void>;
  isLoggedIn: boolean;
}

export interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthContext = createContext<AuthContextType | null>(null);

const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const storageData = localStorage.getItem("token");
    if(storageData){
      setUser(JSON.parse(storageData));
      navigate("/chat");
    }
  }, [])

  const login = async (username: string, password: string) => {
    if(user)
      return;

    const response = await fetch('https://localhost:44373/Public/Authenticate/LoginMobil', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: username,
        password: password
      })
    });

    if(!response.ok){
      toast.error("Kullanıcı adı ya da şifre hatalı!");
      return;
    }

    const data = await response.json() as User;
    setUser(data);
    localStorage.setItem("token", JSON.stringify(data));
    navigate("/chat");
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  const useRefreshToken = async () => {
    if(!user)
      throw new Error("Only authenticated users can refresh token!");
    
    const response = await fetch('https://localhost:44373/Public/Authenticate/MobilRefresh', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        refreshToken: user?.RefreshToken
      })
    });

    if(!response.ok){
      localStorage.removeItem("token");
      setUser(null);
      navigate("/login");
      return;
    }

    const data = await response.json() as RefreshTokenResponse;
    user.AccessToken = data.AccessToken;
    user.ExpiresAt = data.ExpiresAt;
    setUser(user);
    localStorage.setItem("token", JSON.stringify(user));
  }

  const isLoggedIn = user != null;

  return (
    <AuthContext.Provider value={{ user, login, logout, useRefreshToken, isLoggedIn }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;