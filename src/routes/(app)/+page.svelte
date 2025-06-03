<script lang="ts">
import { authClient } from '$lib/auth-client';
import type { PageProps } from './$types';

const { data }: PageProps = $props();

const session = $derived(data.session);

const user = $derived(session?.user);
</script>

{#if !(session && user)}
    <div>
<!--        <SignIn provider="auth0" signInPage="login"/>-->
    </div>
{/if}

{#if session && user}
    <h1>Welcome, {user.name}!</h1>
    <div>
<!--        <button onclick={() => authClient.signIn()}>Sign Out</button>-->
    </div>

{/if}
<p>
    Lorem ipsum dolor sit amet, consectetur adipiscing elit. In ultrices bibendum fringilla. Curabitur maximus mi ut mi
    porttitor, sit amet blandit massa congue. In elementum et risus eu fermentum. Suspendisse sapien nibh, egestas sit
    amet placerat nec, porttitor eget erat. Suspendisse sit amet erat urna. Vestibulum placerat tellus sed feugiat
    rhoncus. Vestibulum ut blandit ipsum, at rutrum lacus. Quisque pulvinar sem quis risus tempus, vitae commodo metus
    imperdiet. Vestibulum augue erat, lacinia quis elit fermentum, maximus lobortis enim. Nam metus urna, commodo ut
    nunc iaculis, consequat tincidunt metus. Phasellus ac ipsum a dui blandit dignissim.
</p>
<p>
    Pellentesque efficitur placerat ultrices. Curabitur vel tincidunt ante, quis vestibulum urna. Cras elit eros,
    ultrices tempor ligula nec, cursus tincidunt elit. Nulla facilisi. Suspendisse quis odio ut quam tempor vehicula.
    Duis dui turpis, consectetur sit amet libero sed, ornare dictum ligula. Vestibulum libero tellus, egestas luctus
    elementum sed, dictum vitae leo. Praesent eleifend, nibh vitae porta hendrerit, lacus lacus sagittis nibh, quis
    posuere ex arcu id erat. Aliquam quis pellentesque mi. Nam id orci sem. Nunc ligula risus, malesuada vel ipsum vel,
    blandit maximus leo. Cras dapibus dictum eros ut dictum. Donec eget porttitor risus, non imperdiet ante. Nunc
    euismod laoreet vulputate.
</p>
<p>
    Vivamus in varius dolor. Suspendisse id lorem eu arcu tincidunt consequat. Cras urna enim, aliquet sit amet interdum
    fermentum, auctor eget urna. Duis aliquet in leo eget ultrices. Vivamus elementum, augue in dapibus euismod, nulla
    lectus efficitur sem, non sagittis ante erat sit amet risus. Vestibulum tincidunt porta nisl nec gravida. Duis nec
    turpis at tortor lacinia elementum. Interdum et malesuada fames ac ante ipsum primis in faucibus. Proin odio magna,
    consequat malesuada est vulputate, consequat tempor diam.
</p>
<p>
    Ut maximus tempus magna, vitae tincidunt velit semper id. Integer ut tortor at magna sagittis tristique. Sed ut
    velit cursus, malesuada orci ac, hendrerit eros. Pellentesque bibendum neque ligula, vitae aliquam justo condimentum
    non. Nulla eget diam consectetur, efficitur erat id, facilisis tellus. Morbi aliquam arcu enim, vitae dapibus purus
    mattis vel. Etiam velit eros, fringilla vitae scelerisque eget, tristique quis nisi. Nulla facilisi. Curabitur in
    turpis dui. Aenean a dolor leo. Proin libero ligula, vestibulum sit amet malesuada id, maximus quis nunc. Quisque
    justo quam, vulputate non nisl at, aliquet bibendum justo. Interdum et malesuada fames ac ante ipsum primis in
    faucibus. Vivamus metus mi, varius sit amet nisi eu, rhoncus elementum sapien.
</p>
<p>
    Suspendisse ut neque ligula. Nam vel velit sollicitudin, tristique libero ut, faucibus nisi. Integer auctor tellus
    ac arcu aliquam, id finibus magna mollis. Donec sollicitudin diam nulla, at finibus quam porttitor sagittis. Aliquam
    ultrices tristique purus in ornare. Curabitur elementum blandit ultricies. Fusce facilisis interdum orci, nec
    faucibus lorem vestibulum ut. Donec vitae orci erat. Vivamus vitae odio ac nulla laoreet viverra eu sed turpis.
    Donec ut scelerisque est.
</p>