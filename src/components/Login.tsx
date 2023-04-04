import { Container, Row, Col, Form, Button, Card, InputGroup, FormGroup } from 'react-bootstrap';
import { IconProp } from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faLock } from "@fortawesome/free-solid-svg-icons";
import { ToastContainer } from 'react-toastify';
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuthContext';

const Login = () => {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const {login} = useAuth();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        login(username, password);
    };

    return (
      <Container className='h-100'>
        <ToastContainer />
        <Row className='justify-content-center align-items-center h-100'>
            <Col sm={12} md={5} lg={3}>
                <Card style={{backgroundColor: "#8e8c8c"}}>
                    <Card.Img variant='top' src='/login-logo.png' className='mx-auto' style={{width: "150px"}} />
                    <Card.Body>
                        <Form onSubmit={handleSubmit}>
                            <FormGroup className='mb-3'>
                                <InputGroup>
                                    <InputGroup.Text>
                                        <FontAwesomeIcon icon={faUser as IconProp} />
                                    </InputGroup.Text>
                                    <Form.Control type="text" placeholder="Kullanıcı Adı*" required onChange={(e) => {setUsername(e.currentTarget.value)}} />
                                </InputGroup>
                            </FormGroup>

                            <FormGroup className='mb-3'>
                                <InputGroup>
                                    <InputGroup.Text>
                                        <FontAwesomeIcon icon={faLock as IconProp} />
                                    </InputGroup.Text>
                                    <Form.Control type="password" placeholder="Şifre*" required onChange={(e) => {setPassword(e.currentTarget.value)}} />
                                </InputGroup>
                            </FormGroup>

                            <Button variant="danger" type="submit" className='w-100'>
                                Giriş
                            </Button>
                        </Form>
                    </Card.Body>
                </Card>
            </Col>
        </Row>
      </Container>  
    );
}

export default Login;