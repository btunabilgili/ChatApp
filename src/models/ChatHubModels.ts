import { AlertProps } from "react-bootstrap";

export interface ConversationModel {
    ConversationId: number;
    Participants: ParticipantModel[];
    LastMessage?: string | null;
    UnreadCount?: number;
    Name?: string | undefined;
    AvatarURL?: string | null;
    CreatedOn: string; 
    ConversationType: ConversationType;
    Selected: boolean;
    Messages: ConversationMessageModel[]
}

export interface ParticipantModel {
    UserId: number;
    NameSurname: string;
    ProfilePhotoPath: string;
    Status: string;
    ConversationId: number;
}

export enum ConversationType {
    OneToOne = 1,
    Group = 2
}

export interface ConversationMessageModel {
    MessageId: number;
    ConversationId: number;
    SenderId: number;
    MessageText: string;
    SentOn: string;
}

// export interface SelectedConversation {
//     ConversationId: number;
//     Name: string;
//     AvatarURL: string;
//     ConversationType: ConversationType;
//     Messages: ConversationMessageModel[];
//     Participants: ParticipantModel[];
// }

export interface LoginResponse {
    AccessToken: string,
    ExpiresAt: string,
    RefreshToken: string
}

export interface RefreshTokenResponse {
    AccessToken: string,
    ExpiresAt: string
}

export interface SendMessageRequest {
    ConversationId: number;
    Message: string;
}

export type AutoDissmissedAlertProps = {
    text: string
} & AlertProps;

export interface User {
    username: string;
    name: string;
    email: string;
    userId: number;
    personel_id: number;
    user_type: string;
    token: Token;
}

export interface TokenClaims {
    auth_type: string;
    email: string;
    exp: number;
    iat: number;
    iss: string;
    name: string;
    nbf: number;
    personel_id: string;
    sub: string;
    user_type: string;
    username: string;
}
  
export interface Token {
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