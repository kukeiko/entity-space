# todo
- performance testing
    - type-checker @ playground.ts is quite slow, check if it gets better if we separate the stuff out into single files (i really do hope so)
- implement remaining properties (e.g. virtual reference(s), complex/struct)
- flesh out domain builder
- filter array of primitives
    - [[f => ...], [f => ...]] signature works
- consider moving generics
    - "D" should probably be always last, since its rare that the value types differ
    - "A" could be moved back as well if we expect users to have it be the same as "K"
