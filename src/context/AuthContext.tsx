import { createContext, useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { AuthContextType, RefreshTokenResponse, AuthProviderProps, User, Token, TokenClaims } from '@/models/ChatHubModels';
import jwtDecode from 'jwt-decode';

export const AuthContext = createContext<AuthContextType | null>(null);

const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const userData = localStorage.getItem("user");

    if(userData){
      setUser(JSON.parse(userData));
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

    const token = await response.json() as Token;

    if(!token?.AccessToken)
      throw new Error("Token is null!");

    const tokenClaims = jwtDecode(token?.AccessToken) as TokenClaims;

    if(!tokenClaims)
      throw new Error("Token claims is null!");

    var userModel = {
      username: tokenClaims.username,
      name: tokenClaims.name,
      email: tokenClaims.email,
      userId: parseInt(tokenClaims.sub),
      personel_id: parseInt(tokenClaims.personel_id),
      user_type: tokenClaims.user_type,
      token: token
    } as User

    setUser(userModel);
    localStorage.setItem("user", JSON.stringify(userModel));
    navigate("/chat");
  };

  const logout = () => {
    localStorage.removeItem("user");
    setUser(null);
  };

  const useRefreshToken = async () => {
    if(!user)
      throw new Error("Only authenticated users can refresh token!");

    if(!user.token || !user.token.RefreshToken)
      throw new Error("Refresh token is null!");
    
    const response = await fetch('https://localhost:44373/Public/Authenticate/MobilRefresh', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        refreshToken: user?.token?.RefreshToken
      })
    });

    if(!response.ok){
      localStorage.removeItem("user");
      setUser(null);
      navigate("/login");
      return;
    }

    const data = await response.json() as RefreshTokenResponse;
    user.token.AccessToken = data.AccessToken;
    user.token.ExpiresAt = data.ExpiresAt;
    setUser(user);
    localStorage.setItem("user", JSON.stringify(user));
  }

  const isLoggedIn = user != null;

  return (
    <AuthContext.Provider value={{ user, login, logout, useRefreshToken, isLoggedIn }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;