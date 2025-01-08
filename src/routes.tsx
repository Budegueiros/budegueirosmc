import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Home from './pages/home'
import Contato from './pages/Contacts'

export const AppRoutes = () => {
    return (
        <BrowserRouter>
            <Routes>
                <Route path='/home' element={
                    <Home />
                } />
                <Route path='/contato' element={
                    <Contato />
                } />

                <Route path='*' element={<Navigate to='/home' />} />

            </Routes>
        </BrowserRouter>
    )
}