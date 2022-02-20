import {Container} from "react-bootstrap";
import MyNavbar from "./navbar";

export default function Layout({ children }) {
    return (
        <>
            <MyNavbar />
            <Container>
                {children}
            </Container>
        </>
    )
}