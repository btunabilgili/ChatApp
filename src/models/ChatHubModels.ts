import { AlertProps } from "react-bootstrap";

export interface OnlineUserModel {
    id: number;
    name: string;
    photoURL: string;
}

export interface ConversationModel {
    ConversationId: number;
    Participants: number[];
    LastMessage?: string | null;
    Name?: string | null;
    AvatarURL?: string | null;
    CreatedOn: string; 
}

export interface ConversationMessageModel {
    MessageId: number;
    ConversationId: number;
    SenderId: number;
    MessageText: string;
    SentOn: string;
}

export interface SelectedConversation {
    ConversationId: number;
    Messages: ConversationMessageModel[];
}

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
} & AlertProps