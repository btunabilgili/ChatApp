import { HubConnection, HubConnectionBuilder } from '@microsoft/signalr'
import { useEffect, useState, useRef } from 'react'
import { ConversationModel, SelectedConversation, ConversationMessageModel, SendMessageRequest } from '../models/ChatHubModels';
import { EllipsisButton,MainContainer, ChatContainer, MessageList, Message, MessageInput, Sidebar, ConversationHeader, Avatar, Search, Conversation, ConversationList, MessageModel, AddUserButton } from '@chatscope/chat-ui-kit-react';
import { useAuth } from '@/hooks/useAuthContext';

const Chat = () => {
  const {user, useRefreshToken} = useAuth();
  const[hubConnection, setHubConnection] = useState<HubConnection>();
  const[conversations, setConversations] = useState<ConversationModel[]>([]);
  const[selectedConversation, setSelectedConversation] = useState<SelectedConversation | null | undefined>();

  useEffect(() => {
    const connectToHub = async () => { 
      if(!user)
        throw new Error("User not authenticated!");

      const hubConnection = new HubConnectionBuilder()
        .withUrl("https://localhost:44373/Chat", {
          accessTokenFactory: () => user?.AccessToken
        })
        .withAutomaticReconnect()
        .build();
  
      hubConnection.on("RecieveMessage", (data: string) => {
        var message = JSON.parse(data);
        setConversations((prevConversations) => 
          prevConversations.map(prevConversation => {
            if(prevConversation.ConversationId === message.ConversationId){
              return {...prevConversation, LastMessage: message.MessageText}
            }
            return prevConversation;
          }));
        
          setSelectedConversation((prev) => {
            if(!prev)
              return null;

            return {...prev, Messages: [...prev.Messages, message]}
          })
      });

      // hubConnection.on("OnlineUsers", (onlineUsers: OnlineUserModel[]) => {
      //   setOnlineUsers(onlineUsers);
      // });

      hubConnection.on("Conversations", (data) => {
        var conversations = JSON.parse(data) as ConversationModel[];
        setConversations(conversations);
      });

      hubConnection.onclose(function (error) {
        console.log("Connection closed due to error: " + error);
      
        // If the error is due to an unauthorized request, obtain a new token and update the stored token
        if (error && error.message === "Unauthorized") {
          console.log("Unauthorized request, obtaining new token...");
        }
      });
  
      await hubConnection.start().catch(e => {
        debugger;
        if(e.statusCode === "401")
          useRefreshToken();
        else
          console.error(e);
      });
  
      setHubConnection(hubConnection);
    };
  
    connectToHub();
  }, []);

  const handleMessageSend = async (message: string) => {
    if(!hubConnection || !message)
      return;

    let messageRequest = {
      ConversationId: selectedConversation?.ConversationId,
      Message: message
    } as SendMessageRequest;

    hubConnection.invoke("SendMessage", messageRequest).then(() => {
      console.log(message);
    }).catch(e => {
      console.error(e);
    });
  };

  const conversationClick = async (conversationId: number) => {
    selectedConversation?.ConversationId && await hubConnection?.invoke("LeaveConversation", selectedConversation.ConversationId);
    await hubConnection?.invoke("JoinConversation", conversationId);
    await hubConnection?.invoke("GetConversationHistory", conversationId).then((data: string) => {
      setSelectedConversation({
        ConversationId: conversationId,
        Messages: JSON.parse(data)
      } as SelectedConversation);
    });
  };

  return (
    <>
      <MainContainer style={{height: "100%"}}>
        <Sidebar position='left'>
          <EllipsisButton />
          <Search placeholder="Search..." />
          <ConversationList>
            {
              conversations.map((conversation) => {
                return (
                  <Conversation key={conversation.ConversationId} name="Melih Falakoğlu" info={conversation.LastMessage} onClick={ () => conversationClick(conversation.ConversationId)} active={selectedConversation?.ConversationId == conversation.ConversationId}>
                    <Avatar src={'https://bys.marmara.edu.tr/upload/personelfoto/' + (conversation.ConversationId === 1 ? '00024/00024004_utv6tss3juet6.jpg' : '00024/00024049_2beroehtsrrqk.png')} name="Lilly" status="available" />
                  </Conversation>
                );
              })
            }                                                                          
          </ConversationList>
        </Sidebar>
        <ChatContainer style={{height: "100%"}}>
          {
            selectedConversation &&
            <ConversationHeader>
              <Avatar src={'https://bys.marmara.edu.tr/upload/personelfoto/' + (selectedConversation.ConversationId === 1 ? '00024/00024004_utv6tss3juet6.jpg' : '00024/00024049_2beroehtsrrqk.png')} name="Zoe" />
              <ConversationHeader.Content userName="Zoe" info="Active 10 mins ago" />          
            </ConversationHeader>
          }
          <MessageList> 
            {
              selectedConversation?.Messages?.length && selectedConversation.Messages.map(messageData => {
                return(
                  <Message key={messageData.MessageId} model={{
                      message: messageData.MessageText,
                      sender: messageData.SenderId.toString(),
                      sentTime: messageData.SentOn,
                      direction: "incoming",
                      position: 'first'
                    } as MessageModel
                  } />
                );
              })
            }
          </MessageList>
          <MessageInput placeholder="Type message here"  onSend={handleMessageSend} disabled={!selectedConversation}/>        
        </ChatContainer>
      </MainContainer>
    </>
  );
}

export default Chat;
