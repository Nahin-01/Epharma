'use strict';

const customerRepository = require('./customer.repository');
const ApiError = require('../../utils/apiError');

async function ensureProfileForUser(userId) {
  const existing = await customerRepository.findByUserId(userId);
  if (existing) return existing;
  return customerRepository.create({ user: userId });
}

async function getMyProfile(userId) {
  const profile = await ensureProfileForUser(userId);
  return profile.populate('user', 'name email phone role isPhoneVerified isEmailVerified');
}

async function updateProfile(userId, data) {
  const profile = await ensureProfileForUser(userId);
  Object.assign(profile, data);
  await profile.save();
  return profile;
}

async function listAddresses(userId) {
  const profile = await ensureProfileForUser(userId);
  return profile.addresses;
}

async function addAddress(userId, addressData) {
  const profile = await ensureProfileForUser(userId);
  if (addressData.isDefault || profile.addresses.length === 0) {
    profile.addresses.forEach((a) => {
      a.isDefault = false;
    });
    addressData.isDefault = true;
  }
  profile.addresses.push(addressData);
  await profile.save();
  return profile.addresses[profile.addresses.length - 1];
}

async function updateAddress(userId, addressId, data) {
  const profile = await ensureProfileForUser(userId);
  const address = profile.addresses.id(addressId);
  if (!address) throw ApiError.notFound('Address not found');

  if (data.isDefault) {
    profile.addresses.forEach((a) => {
      a.isDefault = false;
    });
  }
  Object.assign(address, data);
  await profile.save();
  return address;
}

async function deleteAddress(userId, addressId) {
  const profile = await ensureProfileForUser(userId);
  const address = profile.addresses.id(addressId);
  if (!address) throw ApiError.notFound('Address not found');
  address.deleteOne();
  if (address.isDefault && profile.addresses.length > 0) {
    profile.addresses[0].isDefault = true;
  }
  await profile.save();
  return { removed: true };
}

async function listCustomers({ page, limit }) {
  return customerRepository.list({
    page,
    limit,
    populate: { path: 'user', select: 'name email phone isActive createdAt' },
  });
}

async function getCustomerById(id) {
  const profile = await customerRepository.findById(id, {
    populate: { path: 'user', select: 'name email phone isActive createdAt' },
  });
  if (!profile) throw ApiError.notFound('Customer not found');
  return profile;
}

async function getDefaultAddress(userId) {
  const profile = await ensureProfileForUser(userId);
  return profile.addresses.find((a) => a.isDefault) || profile.addresses[0] || null;
}

module.exports = {
  ensureProfileForUser,
  getMyProfile,
  updateProfile,
  listAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  getDefaultAddress,
  listCustomers,
  getCustomerById,
};
