import React from 'react';
import { Route, Routes } from 'react-router-dom';
import Layout from './components/layout/Layout';
import ProtectedRoute from './components/common/ProtectedRoute';

import Home from './pages/Home';
import ProductListing from './pages/ProductListing';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Login from './pages/Login';
import Register from './pages/Register';
import OtpLogin from './pages/OtpLogin';
import ForgotPassword from './pages/ForgotPassword';
import Account from './pages/Account';
import Orders from './pages/Orders';
import OrderDetail from './pages/OrderDetail';
import UploadPrescription from './pages/UploadPrescription';
import Prescriptions from './pages/Prescriptions';
import NotFound from './pages/NotFound';

import AdminLayout from './components/admin/AdminLayout';
import AdminDashboard from './pages/admin/Dashboard';
import AdminOrders from './pages/admin/Orders';
import AdminProducts from './pages/admin/Products';
import AdminCategories from './pages/admin/Categories';
import AdminInventory from './pages/admin/Inventory';
import AdminCoupons from './pages/admin/Coupons';
import AdminCustomers from './pages/admin/Customers';
import AdminPrescriptions from './pages/admin/Prescriptions';
import AdminDelivery from './pages/admin/Delivery';
import AdminReports from './pages/admin/Reports';

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/products" element={<ProductListing />} />
        <Route path="/products/:slug" element={<ProductDetail />} />

        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/otp-login" element={<OtpLogin />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        <Route
          path="/cart"
          element={
            <ProtectedRoute>
              <Cart />
            </ProtectedRoute>
          }
        />
        <Route
          path="/checkout"
          element={
            <ProtectedRoute>
              <Checkout />
            </ProtectedRoute>
          }
        />
        <Route
          path="/account"
          element={
            <ProtectedRoute>
              <Account />
            </ProtectedRoute>
          }
        />
        <Route
          path="/orders"
          element={
            <ProtectedRoute>
              <Orders />
            </ProtectedRoute>
          }
        />
        <Route
          path="/orders/:id"
          element={
            <ProtectedRoute>
              <OrderDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/upload-prescription"
          element={
            <ProtectedRoute>
              <UploadPrescription />
            </ProtectedRoute>
          }
        />
        <Route
          path="/prescriptions"
          element={
            <ProtectedRoute>
              <Prescriptions />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin"
          element={
            <AdminLayout>
              <AdminDashboard />
            </AdminLayout>
          }
        />
        <Route
          path="/admin/orders"
          element={
            <AdminLayout>
              <AdminOrders />
            </AdminLayout>
          }
        />
        <Route
          path="/admin/products"
          element={
            <AdminLayout>
              <AdminProducts />
            </AdminLayout>
          }
        />
        <Route
          path="/admin/categories"
          element={
            <AdminLayout>
              <AdminCategories />
            </AdminLayout>
          }
        />
        <Route
          path="/admin/inventory"
          element={
            <AdminLayout>
              <AdminInventory />
            </AdminLayout>
          }
        />
        <Route
          path="/admin/coupons"
          element={
            <AdminLayout>
              <AdminCoupons />
            </AdminLayout>
          }
        />
        <Route
          path="/admin/customers"
          element={
            <AdminLayout>
              <AdminCustomers />
            </AdminLayout>
          }
        />
        <Route
          path="/admin/prescriptions"
          element={
            <AdminLayout>
              <AdminPrescriptions />
            </AdminLayout>
          }
        />
        <Route
          path="/admin/delivery"
          element={
            <AdminLayout>
              <AdminDelivery />
            </AdminLayout>
          }
        />
        <Route
          path="/admin/reports"
          element={
            <AdminLayout>
              <AdminReports />
            </AdminLayout>
          }
        />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </Layout>
  );
}
