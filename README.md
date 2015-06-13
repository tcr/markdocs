# marktype

Marktype is a way to create API documentation with anchor links at each API entry, without requiring each API entry to be a markdown header.

Pre-marktype, simply write your documentation like this:

```js
[#] new port.UART([idx[,options]])  
implements DuplexStream
```

The syntax does not have to be exact. Marktype will transform anything after [#] into API syntax.


It should now look like this:

&#x20;<a href="#api-new-port-UART-idx-options-implements-DuplexStream" name="api-new-port-UART-idx-options-implements-DuplexStream">#</a> <i>new</i>&nbsp; port<b>.UART</b> ( [idx[,options]] )  
implements DuplexStream


## Usage

Install:

```sh
$ npm install -g marktype
```

Convert a markdown document to marktype linked style:

```sh
$ marktype convert README.md
```
Convert a marktype linked markdown document back to standard markdown for clean editing:

```sh
$ marktype restore README.md
```
