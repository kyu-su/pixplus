#include <stdio.h>
#include <string.h>
#include <stdlib.h>
#include <ifaddrs.h>
#include <sys/socket.h>
#include <net/if.h>
#include <net/if_dl.h>
#include <net/if_types.h>

// http://field-notes.hatenablog.jp/entry/20101216/1292467817

int main(int argc, char *argv[]) {
  uint64_t target_macaddr;
  char target_macaddr_str[32];

  if (argc < 2) {
    fprintf(stderr, "usage: %s <mac address>\n", argv[0]);
    return 1;
  }

  {
    char *in = argv[1];
    char *out = target_macaddr_str;

    while(1) {
      if (*in == '\0') {
        if ((out - target_macaddr_str) != 12) {
          fprintf(stderr, "invalid macaddr - %s\n", argv[1]);
          return 1;
        }
        *out = '\0';
        break;
      }

      if ((*in >= '0' && *in <= '9') ||
          (*in >= 'a' && *in <= 'f') ||
          (*in >= 'A' && *in <= 'F')) {
        *out++ = *in++;
      } else if (*in == ':' || *in == '-') {
        ++in;
      } else {
        fprintf(stderr, "invalid char detected - %c\n", *in);
        return 1;
      }
    }

    char *end = NULL;
    target_macaddr = strtoull(target_macaddr_str, &end, 16);
    if (end == NULL || *end != '\0') {
      fprintf(stderr, "failed to parse mac addr - %s\n", argv[1]);
      return 1;
    }
  }

  fprintf(stderr, "target macaddr: %012llx\n", target_macaddr);

  struct ifaddrs *ifa_list = NULL, *ifa;
  struct sockaddr_dl *dl;
  char *target_ifname = NULL;
  int ret = 0;

  if (getifaddrs(&ifa_list) < 0) {
    ret = 1;
    goto end;
  }

  for (ifa = ifa_list; ifa; ifa = ifa->ifa_next) {
    dl = (struct sockaddr_dl *)ifa->ifa_addr;
    if (dl->sdl_family == AF_LINK && dl->sdl_type == IFT_ETHER) {
      unsigned char addr[8];
      addr[0] = addr[1] = 0;
      memcpy(addr + 2, (char *)LLADDR(dl), 6);

      uint64_t macaddr = ntohll(*(uint64_t *)addr);
      fprintf(stderr, "%s: %012llx\n", ifa->ifa_name, macaddr);
      if (macaddr == target_macaddr) {
        fprintf(stderr, "found! - %s\n", ifa->ifa_name);
        target_ifname = strdup(ifa->ifa_name);
      }
    }
  }

  if (target_ifname == NULL) {
    fprintf(stderr, "failed to find iface - %s\n", argv[1]);
    ret = 1;
    goto end;
  }

  for (ifa = ifa_list; ifa; ifa = ifa->ifa_next) {
    if (ifa->ifa_addr->sa_family == AF_INET && strcmp(ifa->ifa_name, target_ifname) == 0) {
      const unsigned char *ipaddr = (const unsigned char *)ifa->ifa_addr->sa_data + 2;
      printf("%hhu.%hhu.%hhu.%hhu\n", ipaddr[0], ipaddr[1], ipaddr[2], ipaddr[3]);
      break;
    }
  }

 end:
  if (ifa_list) {
    freeifaddrs(ifa_list);
  }
  return ret;
}
