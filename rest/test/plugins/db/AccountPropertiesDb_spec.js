/*
 * Copyright (c) 2016-present,
 * Jaguar0625, gimre, BloodyRookie, Tech Bureau, Corp. All rights reserved.
 *
 * This file is part of Catapult.
 *
 * Catapult is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Lesser General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Catapult is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with Catapult.  If not, see <http://www.gnu.org/licenses/>.
 */

// const Plugin = require('../../../src/plugins/AccountProperties');
const test = require('./utils/accountPropertiesDbTestUtils');
const { expect } = require('chai');


describe('account properties db', () => {
	describe('account properties by public key', () => {
		it('returns undefined for unknown account', () => {
			// Arrange:
			const address = test.random.account().address;
			const accountProperties1 = test.db.createAccountProperties(address, { address: 3, mosaic: 3, entityType: 3});

			// Assert:
			return test.db.runDbTest(
				accountProperties1,
				db => db.accountPropertiesByAddress([123, 456]),
				entity => { expect(entity).to.equal(undefined); }
			);
		});

		it('returns found empty account properties for given account', () => {
			// Arrange:
			const address = test.random.account().address;
			const accountProperties1 = test.db.createAccountProperties(test.random.account().address, { address: 0, mosaic: 0, entityType: 0});
			const accountProperties2 = test.db.createAccountProperties(address, { address: 0, mosaic: 0, entityType: 0});
			const accountProperties3 = test.db.createAccountProperties(test.random.account().address, { address: 0, mosaic: 0, entityType: 0});

			// Assert:
			return test.db.runDbTest(
				[accountProperties1, accountProperties2, accountProperties3],
				db => db.accountPropertiesByAddress(address),
				entity => { expect(entity).to.deep.equal(accountProperties2) }
			);
		});

		it('returns found populated account properties for given account', () => {
			// Arrange:
			const address = test.random.account().address;
			const accountProperties1 = test.db.createAccountProperties(test.random.account().address, { address: 3, mosaic: 6, entityType: 2});
			const accountProperties2 = test.db.createAccountProperties(address, { address: 3, mosaic: 6, entityType: 2});
			const accountProperties3 = test.db.createAccountProperties(test.random.account().address, { address: 3, mosaic: 6, entityType: 2});

			// Assert:
			return test.db.runDbTest(
				[accountProperties1, accountProperties2, accountProperties3],
				db => db.accountPropertiesByAddress(address),
				entity => { expect(entity).to.deep.equal(accountProperties2) }
			);
		});
	});
});
