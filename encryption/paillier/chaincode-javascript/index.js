/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const voteChaincode = require('./lib/voteChaincode');

module.exports.VoteChaincode = voteChaincode;
module.exports.contracts = [voteChaincode];
