import { HubConnection, HubConnectionBuilder } from '@microsoft/signalr'
import { useEffect, useState } from 'react'
import { ConversationModel, ConversationMessageModel, SendMessageRequest, ConversationType, ParticipantModel } from '../models/ChatHubModels';
import { MainContainer, ChatContainer, MessageList, Message, MessageInput, Sidebar, ConversationHeader, Avatar, Search, Conversation, ConversationList, MessageModel, Button, UserStatus } from '@chatscope/chat-ui-kit-react';
import { useAuth } from '@/hooks/useAuthContext';
import { faAdd, faArrowLeft, faRemove } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { IconProp } from '@fortawesome/fontawesome-svg-core';
import { ToastContainer } from 'react-toastify';
import { toast } from 'react-toastify';

const Chat = () => {
  const {user, useRefreshToken} = useAuth();
  const[hubConnection, setHubConnection] = useState<HubConnection>();
  const[conversations, setConversations] = useState<ConversationModel[]>([]);
  const[users, setUsers] = useState<ParticipantModel[]>([]);
  const[createBtnClicked, setCreateBtnClicked] = useState(false);

  useEffect(() => {
    const connectToHub = async () => { 
      if(!user)
        throw new Error("User not authenticated!");

      const hubConnection = new HubConnectionBuilder()
        .withUrl("https://localhost:44373/Chat", {
          accessTokenFactory: async () => {
            if(new Date(user.token.ExpiresAt).getTime() < Date.now())
              await useRefreshToken();

            return user?.token?.AccessToken;
          }
        })
        .withAutomaticReconnect({
          nextRetryDelayInMilliseconds: retryContext => {
              if (retryContext.elapsedMilliseconds < 300000) {
                return 1000;
              }
              else
                return null;
          }
      })
        .build();
  
      hubConnection.on("ReceiveMessage", (messageData: string, conversationData: string) => {
        const message = JSON.parse(messageData) as ConversationMessageModel;
        const conversation = JSON.parse(conversationData) as ConversationModel | null;
        setConversations((prevConversations) =>{
          if (prevConversations.some(x => x.ConversationId === message.ConversationId))
            return prevConversations.map(prevConversation => {
              if(prevConversation.ConversationId === message.ConversationId) {
                prevConversation.Selected && message.SenderId !== user.userId && hubConnection.invoke("MarkMessageAsSeen", message.MessageId);
                return {
                  ...prevConversation, 
                  Messages: [...prevConversation.Messages ?? [], message],
                  LastMessage: message.MessageText, 
                  UnreadCount: !prevConversation.Selected && message.SenderId !== user.userId ? (prevConversation.UnreadCount ?? 0) + 1 : 0
                };
              }
              return prevConversation;
            });
          else if(conversation)
            return [...prevConversations, {...conversation, Messages: [...conversation?.Messages ?? [], message]}];
          else
            return prevConversations;
        });
      });

      hubConnection.on("Conversations", (data) => {
        var conversations = JSON.parse(data) as ConversationModel[];
        setConversations(conversations);
      });

      hubConnection.on("UserStatusChange", (status: UserStatus, userId: number) => {
        console.log(conversations);
        setConversations(prevState => {
          const updatedConversations = prevState.map(conversation => {
            const updatedParticipants = conversation.Participants.map(participant => {
              if (participant.UserId === userId) {
                return {
                  ...participant,
                  Status: status,
                };
              }
              return participant;
            });
            return {
              ...conversation,
              Participants: updatedParticipants,
            };
          });
          return updatedConversations;
        });
      });

      // hubConnection.onclose(function (error) {
      //   console.log("Connection closed due to error: " + error);
      
      //   if (error && error.message === "Unauthorized") {
      //     console.log("Unauthorized request, obtaining new token...");
      //   }
      // });
  
      await hubConnection.start().catch(e => {
        console.error(e);
      });
  
      setHubConnection(hubConnection);
    };
  
    connectToHub();
  }, []);

  const handleMessageSend = async (message: string) => {
    const selectedConversation = getSelectedConversation();

    if(!hubConnection || !message || !selectedConversation)
      return;

    const messageRequest = {
      ConversationId: selectedConversation.ConversationId,
      Message: message
    } as SendMessageRequest;

    await hubConnection.invoke("SendMessage", messageRequest).catch(e => {
      console.error(e);
    });
  };

  const handleConversationClick = async (conversationId?: number, userId?: number) => {
    createBtnClicked && setCreateBtnClicked(false);

    if (!hubConnection)
      throw new Error("HubConnection not initialized!");

    if (!conversationId) {
      let conversation = conversations.find(x => x.ConversationType === ConversationType.OneToOne && x.Participants.some(x => x.UserId === userId));

      if (conversation)
        conversationId = conversation.ConversationId;
      else if(userId){
        await hubConnection?.invoke("CreateConversation", userId, 1).then(conversationData => {
          conversation = JSON.parse(conversationData) as ConversationModel;
          conversationId = conversation?.ConversationId;
          conversation.Selected = true;
          setConversations(previous => [...previous, conversation as ConversationModel]);
        });
        return;
      }
      else
        throw new Error("Conversation or user not found");
    }
    
    const conversationHistory = await hubConnection.invoke("GetConversationHistory", conversationId).then((data: string) => JSON.parse(data) as ConversationMessageModel[]);
    
    await hubConnection.invoke("MarkMessagesAsSeen", conversationId);

    setConversations(previousConversations =>
      previousConversations.map((item) => {
      if (item.ConversationId === conversationId)
        return {...item, UnreadCount: 0, Messages: conversationHistory, Selected: true};

      return {...item, Selected: false};
    }));
  };

  const createBtnClick = async () => {
    const newConversationButtonClicked = !createBtnClicked;
    setCreateBtnClicked(newConversationButtonClicked);
    newConversationButtonClicked && await hubConnection?.invoke("GetUsers").then(data => {
      setUsers(JSON.parse(data))
    });
  };

  const handleConversationDelete = async (e: React.MouseEvent<HTMLButtonElement, MouseEvent>, conversationId: number) => {
    e.preventDefault();
    e.stopPropagation();

    await hubConnection?.invoke("DeleteConversation", conversationId);
    setConversations(conversations.filter(x => x.ConversationId !== conversationId));

    toast.success("Konuşma başarıyla silindi.");
  }

  const renderConversationList = () => {
    if(!createBtnClicked){
      return conversations.map((conversation) => {
        let name: string | null | undefined;
        let photo: string | null | undefined;
        let participantStatus: UserStatus = "unavailable";
        if(conversation.ConversationType === ConversationType.OneToOne){
          const participant = conversation.Participants.find(x => x.UserId !== user?.userId);

          if(!participant)
            throw new Error("Could not find other participant in one-to-one conversation.");

          name = participant.NameSurname;
          photo = participant.ProfilePhotoPath;
          participantStatus = participant.Status as UserStatus;
        }
        else{
          name = conversation.Name;
          photo = conversation.AvatarURL;
        }

        return (
          <Conversation key={conversation.ConversationId} 
            name={name} 
            info={conversation.LastMessage} 
            onClick={() => handleConversationClick(conversation.ConversationId)} 
            active={conversation.Selected}
            unreadCnt={conversation.UnreadCount}>
            <Avatar src={photo ? 'https://bys.marmara.edu.tr/upload/personelfoto/' + photo : '/default-user.png'} 
              name={name ?? undefined} 
              status={conversation.ConversationType === ConversationType.OneToOne ? 
              participantStatus : undefined} />
            <Conversation.Operations>
              <Button icon={<FontAwesomeIcon icon={faRemove as IconProp} style={{color: "red"}} />} onClick={(e) => handleConversationDelete(e, conversation.ConversationId)} />
            </Conversation.Operations>
          </Conversation>
        );
      });
    }
    else{
      return users.map((user: ParticipantModel, index: number) => {
        return (
          <Conversation key={index} name={user.NameSurname} onClick={() => handleConversationClick(undefined, user.UserId)}>
            <Avatar src={user.ProfilePhotoPath ? 'https://bys.marmara.edu.tr/upload/personelfoto/' + user.ProfilePhotoPath : 'default-user.png'} 
              name={user.NameSurname} status={user.Status as UserStatus} />
          </Conversation>
        );
      });
    }
  };

  const renderChatConversationHeader = () => {
    const selectedConversation = getSelectedConversation();

    if (!selectedConversation)
      return;
  
    const { Participants, AvatarURL, Name } = selectedConversation;
    const isOneToOne = selectedConversation.ConversationType === ConversationType.OneToOne;
    const otherParticipant = Participants.find((x) => x.UserId !== user?.userId);
    const photoPath = isOneToOne ? otherParticipant?.ProfilePhotoPath : AvatarURL;
    const nameSurname = isOneToOne ? otherParticipant?.NameSurname : Name;
    const status = otherParticipant?.Status;
  
    return (
      <ConversationHeader>
        <Avatar status={status as UserStatus} src={`https://bys.marmara.edu.tr/upload/personelfoto/${photoPath}`} name={nameSurname} />
        <ConversationHeader.Content userName={nameSurname} />
      </ConversationHeader>
    );
  };

  const renderMessages = () => {
    const selectedConversation = getSelectedConversation();
  
    if (!selectedConversation?.Messages?.length) {
      return null;
    }
  
    return selectedConversation.Messages.map((messageData, index) => (
      <Message
        key={index}
        model={{
          message: messageData.MessageText,
          sender: messageData.SenderId.toString(),
          sentTime: messageData.SentOn,
          direction: messageData.SenderId !== user?.userId ? "incoming" : "outgoing",
          position: "first"
        }}
      />
    ));
  };

  const getSelectedConversation = () => {
    return conversations.find(x => x.Selected);
  }

  return (
    <>
      <MainContainer style={{height: "100%"}}>
        <ToastContainer autoClose={1500} />
        <Sidebar position='left'>
          <Button icon={<FontAwesomeIcon icon={(!createBtnClicked ? faAdd : faArrowLeft) as IconProp} />} onClick={createBtnClick} />
          <Search placeholder="Search..." />
          <ConversationList>
            {renderConversationList()}
          </ConversationList>
        </Sidebar>
        <ChatContainer style={{height: "100%"}}>
          {renderChatConversationHeader()}
          <MessageList> 
            {renderMessages()}
          </MessageList>
          <MessageInput placeholder="Type message here"  onSend={handleMessageSend} disabled={!getSelectedConversation()}/>        
        </ChatContainer>
      </MainContainer>
    </>
  );
}

export default Chat;
