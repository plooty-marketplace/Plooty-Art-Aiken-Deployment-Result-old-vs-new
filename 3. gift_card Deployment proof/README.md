# cards

## Proof and Deployment on cardano

## Smart Contract for lock assests

https://preview.cardanoscan.io/transaction/ecb17ab8ea983f14996c71086cbaf903ce85de64a0975a7558619d97b68647dd

ecb17ab8ea983f14996c71086cbaf903ce85de64a0975a7558619d97b68647dd


### DATUM HASH Lock

557119fc49672383ba3ff6851758d6c72deca95ff5df045ba1287aff11a06b7f








Write validators in the `validators` folder, and supporting functions in the `lib` folder using `.ak` as a file extension.

```aiken
validator my_first_validator {
  spend(_datum: Option<Data>, _redeemer: Data, _output_reference: Data, _context: Data) {
    True
  }
}
```

## Building

```sh
aiken build
```

## Configuring

**aiken.toml**
```toml
[config.default]
network_id = 41
```

Or, alternatively, write conditional environment modules under `env`.

## Testing

You can write tests in any module using the `test` keyword. For example:

```aiken
use config

test foo() {
  config.network_id + 1 == 42
}
```

To run all tests, simply do:

```sh
aiken check
```

To run only tests matching the string `foo`, do:

```sh
aiken check -m foo
```

## Documentation

If you're writing a library, you might want to generate an HTML documentation for it.

Use:

```sh
aiken docs
```

## Resources

Find more on the [Aiken's user manual](https://aiken-lang.org).
