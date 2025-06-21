import ldap from 'ldapjs';

/**
 * Lightweight helper to perform a simple bind-based LDAP authentication that works
 * against Microsoft Active Directory. The steps are:
 *   1. Bind to the directory using a service account (configured below)
 *   2. Search for the user by sAMAccountName (username)
 *   3. Re-bind as that user with the supplied password to verify credentials
 *
 * Only the attributes we care about are returned; if you need more simply add
 * them to the `attributes` array.
 */

const LDAP_URL = (process.env.LDAP_URL || 'ldap://10.10.20.253:389').trim();
const BIND_DN = (process.env.LDAP_BIND_DN || 'CN=LDAP,DC=tallman,DC=com').trim();
const BIND_PASSWORD = (process.env.LDAP_BIND_PASSWORD || 'ebGGAm77kk').trim();
const SEARCH_BASE = (process.env.LDAP_SEARCH_BASE || 'DC=tallman,DC=com').trim();

// DEBUG: log which LDAP URL is being used at runtime
console.log('LDAP_URL =', LDAP_URL);

export interface LdapUser {
  dn: string;
  displayName?: string;
  mail?: string;
  sAMAccountName?: string;
}

export async function authenticateLdap(username: string, password: string): Promise<LdapUser> {
  return new Promise((resolve, reject) => {
    const client = ldap.createClient({ url: LDAP_URL });

        // Try binding the service account using several common identifier formats in sequence.
    const serviceAccountUser = BIND_DN.match(/^CN=([^,]+)/i)?.[1] || BIND_DN; // 'LDAP' from 'CN=LDAP,...'
    const candidateBindIds: string[] = [
      BIND_DN,                                                   // env DN
      `CN=${serviceAccountUser},CN=Users,${SEARCH_BASE}`,       // typical Users container
      `${serviceAccountUser}@${SEARCH_BASE.replace(/DC=/gi,'').replace(/,/g,'.')}`, // UPN form: LDAP@tallman.com
      `TALLMAN\\${serviceAccountUser}`                          // DOMAIN\\username NTLM form
    ];

    const attemptBind = (index: number) => {
      if (index >= candidateBindIds.length) {
        client.unbind();
        return reject(new Error('LDAP service-account bind failed: all attempts invalid'));
      }
      const dn = candidateBindIds[index];
      client.bind(dn, BIND_PASSWORD, (err) => {
        if (err) {
          console.warn(`Service-account bind attempt failed for '${dn}': ${err.message}`);
          return attemptBind(index + 1);
        }
        // Success
        console.log(`Service-account bind succeeded with '${dn}'`);
        continueAfterBind();
      });
    };

    // 1. Attempt bind(s)
    attemptBind(0);

    function continueAfterBind() {

      // 2. Search for the user entry
        const searchFilter = `(|(sAMAccountName=${username})(userPrincipalName=${username})(mail=${username}))`;
        console.log('LDAP search filter:', searchFilter);
        const opts: ldap.SearchOptions = {
          scope: 'sub',
          filter: searchFilter,
          attributes: ['dn', 'displayName', 'mail', 'sAMAccountName', 'userPrincipalName'],
        } as ldap.SearchOptions;

      client.search(SEARCH_BASE, opts, (searchErr, res) => {
        if (searchErr) {
          client.unbind();
          return reject(new Error('LDAP search failed'));
        }

        let userEntry: LdapUser | null = null;

        res.on('searchEntry', (entry) => {
          userEntry = entry.object as LdapUser;
        });

        res.on('error', (err) => {
          client.unbind();
          reject(err);
        });

        res.on('end', () => {
          const attemptDirectBind = () => {
            // Try UPN and NTLM forms directly without a search DN
            const upn = `${username}@${SEARCH_BASE.replace(/DC=/gi,'').replace(/,/g,'.')}`;
            const ntlm = `TALLMAN\\${username}`;
            const directIds = [upn, ntlm];
            const tryIdx = (i: number) => {
              if (i >= directIds.length) {
                client.unbind();
                return reject(new Error('User not found in LDAP'));
              }
              const id = directIds[i];
              client.bind(id, password, (bindErr) => {
                if (bindErr) {
                  return tryIdx(i + 1);
                }
                // success without search; fabricate minimal user object
                client.unbind();
                return resolve({ dn: id, sAMAccountName: username, userPrincipalName: upn } as LdapUser);
              });
            };
            tryIdx(0);
          };

          if (!userEntry || !userEntry.dn) {
            console.warn('Search returned no entry; falling back to direct bind attempts');
            return attemptDirectBind();
          }

          // 3. Try to bind as the found user with the provided password
          client.bind(userEntry.dn, password, (userBindErr) => {
            if (userBindErr) {
              console.warn('Bind with found DN failed, trying direct bind forms');
              return attemptDirectBind();
            }
            client.unbind();
            resolve(userEntry as LdapUser);
          });
        });
      });
    }
  });
}
