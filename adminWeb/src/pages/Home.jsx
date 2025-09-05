import React, { useEffect, useState } from "react";
import {
  Container,
  Row,
  Col,
  Spinner,
  Button,
  Card,
  Alert,
  ListGroup,
  Navbar,
  Nav,
  Image,
} from "react-bootstrap";

const Home = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ✅ Fetch users from Fastify
  const fetchUsers = async () => {
    try {
      setError(null);
      setLoading(true);

      const response = await fetch("http://localhost:5000/users");
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const data = await response.json();
      console.log("Fetched users:", data);
      setUsers(data);
    } catch (err) {
      console.error("Error fetching users:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Loading UI
  if (loading) {
    return (
      <Container className="d-flex flex-column align-items-center justify-content-center vh-100">
        <Spinner animation="grow" variant="info" />
        <p className="mt-3 text-secondary fw-semibold">Fetching users...</p>
      </Container>
    );
  }

  // Error UI
  if (error) {
    return (
      <Container className="d-flex flex-column align-items-center justify-content-center vh-100">
        <Alert variant="danger" className="text-center">
          <h4>🚨 Something went wrong!</h4>
          <p>{error}</p>
        </Alert>
        <Button variant="outline-danger" onClick={fetchUsers}>
          Retry
        </Button>
      </Container>
    );
  }

  // No users
  if (users.length === 0) {
    return (
      <Container className="d-flex flex-column align-items-center justify-content-center vh-100 text-center">
        <Image
          src="https://cdn-icons-png.flaticon.com/512/747/747376.png"
          width={100}
          height={100}
          className="mb-3 opacity-50"
        />
        <h2>No Members Yet</h2>
        <p className="text-muted">Invite people to join the community 🚀</p>
      </Container>
    );
  }

  // ✅ Users list (new UI)
  return (
    <Container fluid className="min-vh-100 bg-light">
      {/* Top Navbar */}
      <Navbar bg="dark" variant="dark" expand="lg" className="px-4">
        <Navbar.Brand href="#">👥 UserHub</Navbar.Brand>
        <Navbar.Toggle />
        <Navbar.Collapse>
          <Nav className="me-auto">
            <Nav.Link active>Dashboard</Nav.Link>
            <Nav.Link>Settings</Nav.Link>
            <Nav.Link>Help</Nav.Link>
          </Nav>
        </Navbar.Collapse>
      </Navbar>

      <Row className="mt-4">
        <Col md={{ span: 8, offset: 2 }}>
          <Card className="shadow">
            <Card.Header className="bg-info text-white">
              <h5 className="mb-0">
                Community Members ({users.length})
              </h5>
            </Card.Header>
            <ListGroup variant="flush">
              {users.map((user) => (
                <ListGroup.Item
                  key={user.id}
                  className="d-flex align-items-center"
                >
                  <Image
                    src={`https://ui-avatars.com/api/?name=${user.firstName}+${user.lastName}&background=random`}
                    roundedCircle
                    width={50}
                    height={50}
                    className="me-3"
                  />
                  <div>
                    <div className="fw-bold">
                      {user.firstName} {user.lastName}
                    </div>
                    <div className="text-muted">@{user.username}</div>
                    {user.email && (
                      <small className="text-secondary">{user.email}</small>
                    )}
                  </div>
                </ListGroup.Item>
              ))}
            </ListGroup>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Home;
