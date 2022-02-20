import Container from 'react-bootstrap/Container';
import Navbar from 'react-bootstrap/Navbar';
import Nav from 'react-bootstrap/Nav';
import Link from 'next/link';

export default function MyNavbar() {
    return (
        <Navbar bg={"dark"} expand="lg" variant={"dark"}>
            <Container>
                <Navbar.Brand href="/">SeFiLa</Navbar.Brand>
                <Navbar.Toggle aria-controls="basic-navbar-nav" />
                <Navbar.Collapse id="basic-navbar-nav">
                    <Nav className="me-auto">
                        <Link href="/label" passHref>
                            <Nav.Link>Label</Nav.Link>
                        </Link>
                        <Link href="/evaluate" passHref>
                            <Nav.Link>Evaluate</Nav.Link>
                        </Link>
                    </Nav>
                </Navbar.Collapse>
            </Container>
        </Navbar>
    )
}