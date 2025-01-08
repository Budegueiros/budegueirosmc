import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

export const AppRoutes = () => {
    return (
        <BrowserRouter>
            <Routes>
                <Route path='/home' element={
                    <h1 className="text-3xl font-bold underline">
                        Hello world!
                    </h1>
                } />
                <Route path='/home2' element={<p>home 2</p>} />

                <Route path='*' element={<Navigate to='/home' />} />

            </Routes>
        </BrowserRouter>
    )
}