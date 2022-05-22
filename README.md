# StackerDAO

StackerDAOs began as a fork of [ExecutorDAO](https://github.com/MarvinJanssen/executor-dao), and models its design in the same modular and flexible way. The core tenets remain the same:

1. Proposals are smart contracts.
2. The core executes, the extensions give form.
3. Ownership control happens via sending context.

## 1. Proposals are smart contracts

Proposals are expressed as smart contracts. These smart contracts implement a specific `proposal-trait` and may be executed by the DAO when certain conditions are met. It makes StackerDAO extremely flexible and powerful.

## 2. The core executes, the extensions give form

StackerDAO initially consists of just one core contract. Its sole purpose is to execute proposals and to keep a list of authorized extensions. There are no other features: no token, no voting, no functions. The DAO is given form through extension contracts.

Extensions are contracts that can be enabled or disabled by proposals and add specific features to the DAO. They are allowed to assume the "sending context" of the DAO and can thus enact change. Since different groups and organisations have different needs, extensions are rather varied. Some example functionality that can be added to StackerDAO via an extension include:

- The issuance and management of a governance token.
- The ability to submit proposals.
- The ability to vote on proposals.
- The creation and management of a treasury.
- And more...

Since extensions become part of the DAO, they have privileged access to everything else included in the DAO. The trick that allows for extension interoperability is a common authorization check.

*Privileged access is granted when the sending context is equal to that of the DAO or if the contract caller is an enabled DAO extension*.

It allows for extensions that depend on other extensions to be designed. They can be disabled and replaced at any time making StackerDAO fully polymorphic.

## 3. Ownership control happens via sending context

StackerDAO follows a single-address ownership model. The core contract is the de facto owner of external ownable contracts. External contracts thus do not need to implement a complicated access model, as any proposal or extension may act upon it.

*An ownable contract is to be understood as a contract that stores one privileged principal that may change internal state.*

*Any ownable contract, even the ones that were deployed before StackerDAO came into use, can be owned and managed by the DAO*.

## Extensions

The StackerDAO code base comes with several additional extension contracts. The modified extentions are designated by a code that starts with "SDE" followed by an incrementing number of three digits.

## Proposals

StackerDAOs also comes with some example proposals. These are designated by a code that starts with "SDP" followed by an incrementing number of three digits. The numbers do not to coincide with extension numbering.

## Testing

```clarinet test```

## Example: Multisignature Setup

To showcase how it works, let's say we want to set up a basic "Multisignature" DAO. The first thing you need to do is give your DAO form, via `Extensions`.

You can do this through what we call a "Bootstrap" proposal that enables the `Multisignature` extensions you need:

```clojure
;; Example Bootstrap Proposal
;; sdp-multisignature-dao.clar

(impl-trait .proposal-trait.proposal-trait)

(define-public (execute (sender principal))
  (begin
    ;; Enable extensions to give your DAO form.
    (try! (contract-call? .executor-dao set-extensions
      (list
        {extension: .sde-vault, enabled: true}
        {extension: .sde-multisig, enabled: true}
      )
    ))

    ;; Add signers to your DAO.
    (try! (contract-call? .sde-multisig add-signer 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM))
    (try! (contract-call? .sde-multisig add-signer 'ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5))
    (try! (contract-call? .sde-multisig add-signer 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG))
    (ok true)
  )
)
```

You can think of the "Bootstrap" proposal as an initializer for your DAO. Inside `clarinet console`, you can execute it by typing:

```clojure
(contract-call? .executor-dao init .sdp-multisignature-bootstrap)
```

# License

MIT license
