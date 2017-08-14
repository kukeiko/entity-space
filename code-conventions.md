# code style
in addition to the tslint rules, the following should apply:
* private class members are prefixed with _
* everything that can have a return type should have one

## function arguments
a decision should be made between using a single typed object literal and multiple arguments in sequence.
a single typed object literal makes sense when there will be a lot of optional flags or if the total number
of arguments might ever exceed 4.

depending on how it is used code readability can improve or worsen quite a bit.

# git commit message prefixes
indicators to denote the type of change to the codebase.
any of these may be used even if there are breaking changes (except maybe 'test'), since we are not at 1.0.0 yet

## **add**
functionality is added
## **mod**
functionality changes
## **test**
tests were added, removed, changed, enabled/disabled
## **polish**
pretty much everything that has to do with improving the health of the codebase, e.g.
changes to improve clarity / follow conventions / cleanup:
* linter errors/warnings
* classes/files/folders are moved/renamed
* properties/methods/functions are renamed
* comments to illustrate functionality
* unused files/functions are removed
* code usability is increased

## **meta**
anything about the project itself - readme, setup, build pipeline, etc.