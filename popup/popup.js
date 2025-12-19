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
    document.getElementById('SubmitButtonv6').addEventListener('click', calculateNetworkv6);
    document.getElementById('networkinputv6').addEventListener("keypress", function(event) {
        if (event.key === "Enter") {
            event.preventDefault();
            document.getElementById('SubmitButtonv6').click();
        }
    });
    document.getElementById('maskv6').addEventListener("keypress", function(event) {
        if (event.key === "Enter") {
            event.preventDefault();
            document.getElementById('SubmitButtonv6').click();
        }
    });
});


//
// IPv4
//
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

//IPv6
function calculateNetworkv6() {
    var newNetworkStr = document.getElementById("networkinputv6").value;
    var newMask = parseInt(document.getElementById('maskv6').value);
    
    var newNetworkList = ipv6AddressToList(newNetworkStr);
    if (newNetworkList === null) {
        alert('Invalid network address entered');
        return;
    }
    
    if (newMask < 0) {
        newMask = 1
    }
    
    if (newMask > 128) {
        newMask = 32
    }
    
    outputValsv6(newNetworkList, newMask);
    
}

function ipv6AddressToList(address) {
    //fuck this regex lmao
    //check if valid IPv6
    var regex= /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/;
    var result = regex.exec(address);

    if (result == null) {
        return null;
    }

    return expandIPv6Address(address)
}

function expandIPv6Address(address)
{
    var fullAddress = "";
    var expandedAddress = "";
    var validGroupCount = 8;
    var validGroupSize = 4;

    var ipv4 = "";
    var extractIpv4 = /([0-9]{1,3})\.([0-9]{1,3})\.([0-9]{1,3})\.([0-9]{1,3})/;
    var validateIpv4 = /((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})/;

    // look for embedded ipv4
    if(validateIpv4.test(address))
    {
        groups = address.match(extractIpv4);
        for(var i=1; i<groups.length; i++)
        {
            ipv4 += ("00" + (parseInt(groups[i], 10).toString(16)) ).slice(-2) + ( i==2 ? ":" : "" );
        }
        address = address.replace(extractIpv4, ipv4);
    }

    if(address.indexOf("::") == -1) // All eight groups are present.
        fullAddress = address;
    else // Consecutive groups of zeroes have been collapsed with "::".
    {
        var sides = address.split("::");
        var groupsPresent = 0;
        for(var i=0; i<sides.length; i++)
        {
            groupsPresent += sides[i].split(":").length;
        }
        fullAddress += sides[0] + ":";
        for(var i=0; i<validGroupCount-groupsPresent; i++)
        {
            fullAddress += "0000:";
        }
        fullAddress += sides[1];
    }
    var groups = fullAddress.split(":");
    for(var i=0; i<validGroupCount; i++)
    {
        while(groups[i].length < validGroupSize)
        {
            groups[i] = "0" + groups[i];
        }
    }
    return groups;
}

function outputValsv6(ipv6_address_list, cidr) {
    
    var ipv6netaddrinfo = IPv6infoddrFromList(ipv6_address_list, cidr);
    
    if (cidr == 128) {
        
        hostnum = 1
        
    } else {
        hostnum = Math.pow(2, (128 - cidr))
    }
    /* expanded address */
    document.getElementById('expandedaddrv6').innerText = ipv6_address_list.join(':');
    
    /* net mask */
    document.getElementById('netaddrv6').innerText = ipv6netaddrinfo[0].join(':')
    
    /* total */
    document.getElementById('totalipv6').innerText = hostnum.toLocaleString();
    
    /* useable addresses */
    document.getElementById('usablerngv6').innerText = ipv6netaddrinfo[0].join(':') + " - " + ipv6netaddrinfo[2].join(':')

    /* Current use 
    curUse = address_classification(address_list)
    document.getElementById("currentuse").innerText = curUse[0]
    if (curUse[1] == "nolink") {
        document.getElementById("currentuse").removeAttribute("href")
    } else {
        document.getElementById("currentuse").href = curUse[1]
    }
    */
}

function IPv6infoddrFromList(address_list, cidr) {
    
    if (cidr == 128) {
        return [address_list, address_list, address_list];
    }

    //Convert hex groups into binary
    var binaryList = []
    for (var i = 0; i < address_list.length; i++) {
        binaryList[i] = (parseInt(address_list[i], 16).toString(2)).padStart(16, '0');
    }

    //split then join so I have a 128 long array of binary
    var fullBin = binaryList.join('').split('');

    var fullNetAddrBin = fullBin.slice();
    var fullLastAddrbin = fullBin.slice();

    //console.log(fullNetAddrBin)

    //Set all 0s if not masked by cidr
    for (let i = cidr; i < 128; i++) {
        fullNetAddrBin[i] = "0"; // set 0 for network address
        fullLastAddrbin[i] = "1"; // set 1 for last address
    }

    //First address is network address with last bit set
    var fullFirstAddrBin = fullNetAddrBin.slice();
    fullFirstAddrBin[127] = "1";

    console.log(fullNetAddrBin)
    console.log(fullFirstAddrBin)
    console.log(fullLastAddrbin)

    var fullNetAddrBinRecombine = [];
    var fullFirstAddrBinRecombine = [];
    var fullLastAddrBinRecombine = [];


    //recombine binary into 8 groups of 16
    for (let i = 1; i < 9; i++) {
        fullNetAddrBinRecombine[i-1] = fullNetAddrBin.slice(((i*16)-16), i*16).join('')
        fullFirstAddrBinRecombine[i-1] = fullFirstAddrBin.slice(((i*16)-16), i*16).join('')
        fullLastAddrBinRecombine[i-1] = fullLastAddrbin.slice(((i*16)-16), i*16).join('')
    }

    var netAddrRecombined = [];
    var firstAddrRecombined = [];
    var LastAddrRecombined = [];

    //convert back into hex address list
    for (let i = 0; i < 8; i++) {
        netAddrRecombined[i] = parseInt(fullNetAddrBinRecombine[i], 2).toString(16).padStart(4, '0');
        firstAddrRecombined[i] = parseInt(fullFirstAddrBinRecombine[i], 2).toString(16).padStart(4, '0');
        LastAddrRecombined[i] = parseInt(fullLastAddrBinRecombine[i], 2).toString(16).padStart(4, '0');
    }
    console.log(netAddrRecombined)
    console.log(firstAddrRecombined)
    console.log(LastAddrRecombined)

    return [netAddrRecombined, firstAddrRecombined, LastAddrRecombined];

}

// Tab switching code
function tabswitch(evt, tabname) {
  var i, tabcontent, tablinks;
  tabcontent = document.getElementsByClassName("tabcontent");
  for (i = 0; i < tabcontent.length; i++) {
    tabcontent[i].style.display = "none";
  }
  tablinks = document.getElementsByClassName("tablinks");
  for (i = 0; i < tablinks.length; i++) {
    tablinks[i].className = tablinks[i].className.replace(" active", "");
  }
  document.getElementById(tabname).style.display = "block";
  evt.currentTarget.className += " active";
}
