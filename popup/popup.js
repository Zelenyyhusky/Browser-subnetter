var curNetwork = 0;
var curMask = 0;

document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('SubmitButton').addEventListener('click', calculateNetwork);
    document.getElementById('networkinput').addEventListener("keypress", function(event) {
        if (event.key === "Enter") {
            event.preventDefault();
            document.getElementById('SubmitButton').click();
        }
    });
    document.getElementById('mask').addEventListener("keypress", function(event) {
        if (event.key === "Enter") {
            event.preventDefault();
            document.getElementById('SubmitButton').click();
        }
    });
});



function calculateNetwork() {
    var newNetworkStr = document.getElementById("networkinput").value;
    var newMask = parseInt(document.getElementById('mask').value);
    
    var newNetwork = inet_aton(newNetworkStr);
    if (newNetwork === null) {
        alert('Invalid network address entered');
        return;
    }
    
    if (newMask < 0) {
        newMask = 1
    }
    
    if (newMask > 32) {
        newMask = 32
    }
    
    outputVals(newNetwork, newMask);
    
}

function outputVals(address, cidr) {
    address_list = addr_to_list(address)
    
    if (cidr == 32) {
        
        netaddress_list = address_list
        lowaddr_list = address_list
        broadcast_list = address_list
        highaddr_list = address_list
        
        hostnum = 1
        
    } else {
        
        mask_list = mask_list_from_cidr(cidr)
        
        netaddress_list = netaddr_from_addr_list(address_list, mask_list)
        wildcard_list = wildcard_from_mask(mask_list)
        broadcast_list = broadcast_from_addr_list(netaddress_list, wildcard_list)
        
        lowaddr_list = netaddress_list.slice()
        lowaddr_list[3] += 1
        highaddr_list = broadcast_list.slice()
        highaddr_list[3] -= 1
        
        hostnum = Math.pow(2, (32 - cidr)) - 2
    }
    /* net address */
    document.getElementById('netaddr').innerText = netaddress_list.join('.')
    
    /* net mask */
    document.getElementById('netmask').innerText = mask_list.join('.')
    
    /*wildcard*/
    document.getElementById('wildmask').innerText = wildcard_list.join('.')
    
    /* useable addresses */
    document.getElementById('usablerng').innerText = lowaddr_list.join('.') + " - " + highaddr_list.join('.')
    
    /* Hosts */
    document.getElementById('hostcount').innerText = hostnum
    
    /* broadcast */
    document.getElementById('broadcastaddr').innerText = broadcast_list.join('.')

    /* Current use */
    curUse = address_classification(address_list)
    document.getElementById("currentuse").innerText = curUse[0]
    if (curUse[1] == "nolink") {
        document.getElementById("currentuse").removeAttribute("href")
    } else {
        document.getElementById("currentuse").href = curUse[1]
    }
}

function mask_list_from_cidr(cidr) {
    
    var mask = 0xFFFFFFFF << (32 - cidr);
    
    return [
        (mask >> 24) & 0xFF, // First octet
        (mask >> 16) & 0xFF, // Second octet
        (mask >> 8) & 0xFF, // Third octet
        mask & 0xFF // Fourth octet
    ];
}

function wildcard_from_mask(mask) {
    return [(255 - mask[0]),
    (255 - mask[1]),
    (255 - mask[2]),
    (255 - mask[3])
]
}

function dec2bin(dec) {
    return (dec >>> 0).toString(2);
}

function addr_to_list(address) {
    return [((address >> 24) & 0xff),
        ((address >> 16) & 0xff),
        ((address >> 8) & 0xff),
        (address & 0xff)
    ];
}

function addr_list_to_bin(address_list) {
    return [dec2bin(address_list[0]),
    dec2bin(address_list[1]),
    dec2bin(address_list[2]),
    dec2bin(address_list[3])
]
}

function netaddr_from_addr_list(addr_list, mask_list) {
    return [
        (addr_list[0] & mask_list[0]),
        (addr_list[1] & mask_list[1]),
        (addr_list[2] & mask_list[2]),
        (addr_list[3] & mask_list[3])
    ]
}

function broadcast_from_addr_list(addr_list, wildcard_list) {
    return [
        (addr_list[0] ^ wildcard_list[0]),
        (addr_list[1] ^ wildcard_list[1]),
        (addr_list[2] ^ wildcard_list[2]),
        (addr_list[3] ^ wildcard_list[3])
    ]
}

function inet_aton(addrstr) {
    var re = /^([0-9]{1,3})\.([0-9]{1,3})\.([0-9]{1,3})\.([0-9]{1,3})$/;
    var res = re.exec(addrstr);
    
    if (res === null) {
        return null;
    }
    
    for (var i = 1; i <= 4; i++) {
        if (res[i] < 0 || res[i] > 255) {
            return null;
        }
    }
    
    return (res[1] << 24) | (res[2] << 16) | (res[3] << 8) | res[4];
}

function address_classification(addr_list, cidr) {
    
    /*
        All addresses/ranges are sourced from these documents
        https://www.iana.org/assignments/iana-ipv4-special-registry/iana-ipv4-special-registry.xhtml
        https://www.iana.org/assignments/multicast-addresses/multicast-addresses.xhtml
    */


    if (addr_list[0] == 0) {
        if (addr_list[3] == 0) {
            
            return ['"This host on this network"', "https://www.rfc-editor.org/rfc/rfc791.html"]
            
        } else {
            
            return ['"This network"', "https://www.rfc-editor.org/rfc/rfc1122.html"]
            
        }
    } else if (addr_list[0] == 10) {
        
        return ["Private Use", "https://www.rfc-editor.org/rfc/rfc1918.html"]
        
    } else if (addr_list[0] == 100) {
        if (addr_list[1] >= 64 && addr_list[1] <= 127) {
            
            return ["Shared Spare (CG-NAT)", "https://www.rfc-editor.org/rfc/rfc6598.html"]
            
        }
    } else if (addr_list[0] == 127) {
        
        return ["Loopback", "https://www.rfc-editor.org/rfc/rfc1122.html"]
        
    } else if (addr_list[0] == 169) {
        if (addr_list[1] == 254) {
            
            return ["Link Local/APIPA", "https://www.rfc-editor.org/rfc/rfc3927.html"]
        }
    } else if (addr_list[0] == 172) {
        if (addr_list[1] >= 16 && addr_list[1] <= 31) {

            return ["Private Use", "https://www.rfc-editor.org/rfc/rfc1918.html"]

        }
    } else if (addr_list[0] == 192) {
        if (addr_list[1] == 0) {
            if (addr_list[2] == 0) {
                if (addr_list[3] == 8) {

                    return ["IPv4 dummy address", "https://www.rfc-editor.org/rfc/rfc7600.html"]

                } else if (addr_list[3] == 9) {

                    return ["Port Control Protocol Anycast", "https://www.rfc-editor.org/rfc/rfc7723.html"]

                } else if (addr_list[3] == 10) {

                    return ["Traversal Using Relays around NAT Anycast", "https://www.rfc-editor.org/rfc/rfc8155.html"]

                } else if (addr_list[3] == 170) {

                    return ["NAT64 Discovery", "https://www.rfc-editor.org/rfc/rfc8880.html"]

                } else if (addr_list[3] == 171) {

                    return ["DNS64 Discovery", "https://www.rfc-editor.org/rfc/rfc7050.html"]
                
                } else {

                    return ["IETF Protocol Assignments", "https://www.rfc-editor.org/rfc/rfc6890.html"]

                }
            } else if (addr_list[2] == 2) {

                return ["Documentation (TEST-NET-1)", "https://www.rfc-editor.org/rfc/rfc5737.html"]
            
            } else {

             // ?? I think public?

            }
        } else if (addr_list[1] == 31) {
            if (addr_list[2] == 196) {

                return ["AS112-v4", "https://www.rfc-editor.org/rfc/rfc7535.html"]

            }
        } else if (addr_list[1] == 52) {
            if (addr_list[2] == 193) {

                return ["AMT", "https://www.rfc-editor.org/rfc/rfc7450.html"]

            }
        } else if (addr_list[1] == 88) {
            if (addr_list[2] == 99) {
                if (addr_list[3] == 2) {
                
                    return ["6a44-relay anycast address", "https://www.rfc-editor.org/rfc/rfc6751.html"]
                
                }

                return ["Deprecated (6to4 Relay Anycast)", "https://www.rfc-editor.org/rfc/rfc7526.html"]

            }
        } else if (addr_list[1] == 168) {
            
            return ["Private-Use", "https://www.rfc-editor.org/rfc/rfc1918.html"]
            
        } else if (addr_list[1] == 175) {
            if (addr_list[2] == 48) {
            
                return ["Direct Delegation AS112 Service", "https://www.rfc-editor.org/rfc/rfc7534.html"]
                
            }
        }
    } else if (addr_list[0] == 198) {
        if (addr_list[1] == 18 || addr_list[1] == 19) {

            return ["Benchmarking", "https://www.rfc-editor.org/rfc/rfc2544.html"]

        } else if (addr_list[1] == 51) {
            if (addr_list[1] == 100) {

                return ["Documentation (TEST-NET-2)", "https://www.rfc-editor.org/rfc/rfc5737.html"]

            }
        }
    } else if (addr_list[0] == 203) {
        if (addr_list[1] == 0) {
            if (addr_list[2] == 113) {

                return ["Documentation (TEST-NET-3)", "https://www.rfc-editor.org/rfc/rfc5737.html"]

            }
        }
    } else if (addr_list[0] >= 224 && addr_list[0] <= 239) {

        // TODO: do all the multicast ranges
        return ["Multicast", "https://www.rfc-editor.org/rfc/rfc1112.html"]

    } else {

        return ["Public IP space", "nolink"]

    }

    return ["Public IP space", "nolink"]
    
}